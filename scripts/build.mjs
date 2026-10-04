#!/usr/bin/env node
/**
 * DSH Skill Aggregator — build a single "aggregate" GitHub repo that the
 * dsh-skills-manager panel can scan in one shot.
 *
 * WHY this design (measured, see case E-001):
 *   - The panel downloads the WHOLE repo zip, hard cap 32 MiB, and scans
 *     every SKILL.md (max 500 per repo). It cannot point at upstream as-is:
 *     anthropics/skills is fine (11 MB / 20 skills) but
 *     sickn33/agentic-awesome-skills is 312 MB / 8218 skills.
 *   - raw.githubusercontent.com is ECONNRESET on the local machine, and
 *     api.github.com anonymous is 60 req/h (measured 403). So the authoritative
 *     build runs in GitHub Actions with GITHUB_TOKEN (5000 req/h).
 *
 * OUTPUT: <out>/skills/<category>/<skill-name>/...  + index.json
 * Everything else in <out> is disposable.
 */

import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { join, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// ── Hard limits mirrored from dsh-skills-manager lib/repositories.js ──────────
const PANEL_MAX_ZIP = 32 * 1024 * 1024; // LIMIT = 32 << 20
const PANEL_MAX_SKILLS = 500;
const PANEL_MAX_SKILL_MD = 256 * 1024;
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

// We keep the published repo well under the panel cap so every skill dir has room.
const BUDGET_BYTES = Number(process.env.AGG_BUDGET_BYTES || 26 * 1024 * 1024);
const PER_FILE_MAX = 512 * 1024; // assets larger than this are dropped
const DROP_EXT =
  /\.(zip|tar|gz|tgz|7z|rar|mp4|mov|avi|mkv|webm|exe|dll|so|dylib|bin|onnx|pt|pth|safetensors|gguf|iso|dmg|msi|jar|wasm)$/i;

// ── Frontmatter parsing, identical semantics to the panel ────────────────────
function parseDoc(text) {
  if (!text.startsWith("---")) return { hasFrontmatter: false, map: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end < 0) return { hasFrontmatter: false, map: {}, body: text };
  const map = {};
  for (const raw of text.slice(3, end).split(/\r?\n/)) {
    const m = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(raw);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    map[m[1]] = v;
  }
  return { hasFrontmatter: true, map, body: text.slice(end + 4) };
}

export function skillValidity(text) {
  const doc = parseDoc(text);
  const name = String(doc.map.name || "");
  const description = String(doc.map.description || "");
  const ok =
    doc.hasFrontmatter &&
    SKILL_NAME_RE.test(name) &&
    !RESERVED.test(name) &&
    name.length <= 100 &&
    description.length > 0;
  return { ok, name, description, doc };
}

// ── GitHub access (token-aware; CI uses GITHUB_TOKEN) ────────────────────────
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const headers = {
  "User-Agent": "dsh-skill-aggregator",
  Accept: "application/vnd.github+json",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gh(url, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(90000) });
      if (res.status === 403 || res.status === 429) {
        const reset = Number(res.headers.get("x-ratelimit-reset") || 0) * 1000;
        const wait = reset > Date.now() ? Math.min(reset - Date.now(), 60000) : 3000 * (i + 1);
        console.warn(`  [rate] ${res.status} ${url} -> wait ${Math.round(wait / 1000)}s`);
        await sleep(wait);
        continue;
      }
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
  return null;
}

/** blob cache: fetch whole repo tree once, then raw blobs via /git/blobs (no rate-limit-per-file). */
async function loadRepo(owner, name, ref) {
  const treeJson = await gh(`https://api.github.com/repos/${owner}/${name}/git/trees/${encodeURIComponent(ref)}?recursive=1`);
  if (!treeJson) throw new Error(`tree not found: ${owner}/${name}@${ref}`);
  const blobs = treeJson.tree.filter((e) => e.type === "blob");
  const blobCache = new Map();

  async function readBlob(sha) {
    if (blobCache.has(sha)) return blobCache.get(sha);
    const j = await gh(`https://api.github.com/repos/${owner}/${name}/git/blobs/${sha}`);
    if (!j) throw new Error(`blob missing: ${sha}`);
    const buf = Buffer.from(String(j.content || "").replace(/\s/g, ""), "base64");
    blobCache.set(sha, buf);
    return buf;
  }

  return { owner, name, ref, blobs, readBlob, truncated: !!treeJson.truncated };
}

// ── Skill discovery inside an upstream repo ─────────────────────────────────
function discoverSkills(repo, { include = [], exclude = [] } = {}) {
  const skillFiles = repo.blobs.filter((b) => b.path === "SKILL.md" || b.path.endsWith("/SKILL.md"));
  const dirs = [];
  for (const f of skillFiles) {
    const dir = f.path === "SKILL.md" ? "" : f.path.slice(0, -"/SKILL.md".length);
    if (include.length && !include.some((p) => dir === p || dir.startsWith(p + "/"))) continue;
    if (exclude.some((p) => dir === p || dir.startsWith(p + "/"))) continue;
    // skip eval/fixture trees that are not real installable skills
    if (/(^|\/)(evals?|tests?|__tests__|fixtures?|examples?\/files)\//.test(dir + "/")) continue;
    dirs.push({ dir, sha: f.sha, size: f.size || 0 });
  }
  return dirs;
}

function filesForSkill(repo, dir) {
  const prefix = dir ? dir + "/" : "";
  const seen = new Map();
  for (const b of repo.blobs) {
    if (!b.path.startsWith(prefix)) continue;
    const rel = b.path.slice(prefix.length);
    if (!rel) continue;
    seen.set(rel, b);
  }
  return seen;
}

// ── Main build ──────────────────────────────────────────────────────────────
export async function build({ manifest, outDir, log = console.log }) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(join(outDir, "skills"), { recursive: true });

  const index = { generatedAt: new Date().toISOString(), budgetBytes: BUDGET_BYTES, usedBytes: 0, skills: [], skipped: [] };
  const usedNames = new Map(); // skill name -> source, panel refuses duplicates
  let used = 0;

  for (const src of manifest.sources) {
    log(`\n=== source: ${src.owner}/${src.name}@${src.ref} (category=${src.category || "misc"}) ===`);
    let repo;
    try {
      repo = await loadRepo(src.owner, src.name, src.ref);
    } catch (e) {
      log(`  SKIP repo: ${e.message}`);
      index.skipped.push({ source: `${src.owner}/${src.name}`, reason: e.message });
      continue;
    }
    if (repo.truncated) log("  [warn] tree truncated by GitHub; results incomplete");

    const found = discoverSkills(repo, { include: src.include || [], exclude: src.exclude || [] });
    log(`  discovered ${found.length} skill dirs`);
    let taken = 0;

    for (const item of found) {
      if (index.skills.length >= PANEL_MAX_SKILLS) {
        index.skipped.push({ source: `${src.owner}/${src.name}`, path: item.dir, reason: "panel skill limit 500 reached" });
        continue;
      }
      let md;
      try {
        md = (await repo.readBlob(item.sha)).toString("utf8");
      } catch (e) {
        index.skipped.push({ source: `${src.owner}/${src.name}`, path: item.dir, reason: "read: " + e.message });
        continue;
      }
      if (Buffer.byteLength(md, "utf8") > PANEL_MAX_SKILL_MD) {
        index.skipped.push({ source: `${src.owner}/${src.name}`, path: item.dir, reason: "SKILL.md > 256KiB" });
        continue;
      }
      const v = skillValidity(md);
      if (!v.ok) {
        index.skipped.push({ source: `${src.owner}/${src.name}`, path: item.dir, reason: `invalid frontmatter (name="${v.name}")` });
        continue;
      }

      // Priority / override handling. The panel REJECTS duplicate skill names, so a
      // later source can only replace an earlier one by declaring the name in
      // `overrides`. Without this, the first source permanently shadows every
      // localized or updated variant (observed: 16 zh-CN skills all dropped).
      const existing = usedNames.get(v.name);
      if (existing && existing.source !== `${src.owner}/${src.name}`) {
        if (!(src.overrides || []).includes(v.name)) {
          index.skipped.push({
            source: `${src.owner}/${src.name}`,
            path: item.dir,
            reason: `duplicate skill name "${v.name}" already provided by ${existing.source}`,
          });
          continue;
        }
        const at = index.skills.findIndex((s) => s.name === v.name);
        if (at >= 0) {
          const old = index.skills[at];
          used -= old.bytes;
          // Also remove the superseded directory from disk: leaving both on disk makes
          // the panel see two SKILL.md with the same frontmatter name and reject them.
          await rm(join(outDir, ...old.path.split("/")), { recursive: true, force: true });
          index.skills.splice(at, 1);
          index.skipped.push({ source: old.source, path: old.path, reason: `superseded by ${src.owner}/${src.name} (overrides)` });
        }
      }

      const files = filesForSkill(repo, item.dir);
      const plan = [];
      let cost = 0;
      let overdrawn = false;
      for (const [rel, b] of files) {
        // Nested test/fixture scaffolding (e.g. evals/files/**) carries its own
        // SKILL.md files that the panel would scan and collide on.
        if (/(^|\/)(evals?|tests?|__tests__|fixtures?|examples?)(\/|$)/.test(rel)) {
          index.skipped.push({ source: `${src.owner}/${src.name}`, path: posix.join(item.dir, rel), reason: "nested test/fixture path" });
          continue;
        }
        if ((b.size || 0) > PER_FILE_MAX) {
          index.skipped.push({ source: `${src.owner}/${src.name}`, path: posix.join(item.dir, rel), reason: "asset > 512KiB dropped" });
          continue;
        }
        if (DROP_EXT.test(rel)) {
          index.skipped.push({ source: `${src.owner}/${src.name}`, path: posix.join(item.dir, rel), reason: "binary extension dropped" });
          continue;
        }
        cost += b.size || 0;
        if (used + cost > BUDGET_BYTES) {
          overdrawn = true;
          break;
        }
        plan.push([rel, b]);
      }
      if (overdrawn || !plan.length) {
        index.skipped.push({
          source: `${src.owner}/${src.name}`,
          path: item.dir,
          reason: overdrawn ? "budget exhausted" : "no copyable files",
        });
        continue;
      }

      const target = join(outDir, "skills", src.category || "misc", v.name);
      for (const [rel, b] of plan) {
        const dest = join(target, ...rel.split("/"));
        await mkdir(dirname(dest), { recursive: true });
        const buf = rel === "SKILL.md" ? Buffer.from(md, "utf8") : await repo.readBlob(b.sha);
        await writeFile(dest, buf);
      }
      used += cost;
      taken++;
      usedNames.set(v.name, { source: `${src.owner}/${src.name}`, priority: Number(src.priority || 0) });
      index.skills.push({
        name: v.name,
        category: src.category || "misc",
        description: v.description,
        path: posix.join("skills", src.category || "misc", v.name),
        source: `${src.owner}/${src.name}`,
        sourceRef: src.ref,
        sourceUrl: `https://github.com/${src.owner}/${src.name}/tree/${src.ref}/${item.dir || "."}`,
        license: src.license || null,
        files: plan.map(([rel, b]) => ({ path: rel, size: b.size || 0, sha256: sha256(rel === "SKILL.md" ? Buffer.from(md, "utf8") : null) })),
        bytes: cost,
      });
    }
    log(`  kept ${taken} skills (running total ${index.skills.length}, ${(used / 1048576).toFixed(2)} MiB)`);
  }

  index.usedBytes = used;
  await writeFile(join(outDir, "index.json"), JSON.stringify(index, null, 2));
  await writeFile(
    join(outDir, "README.md"),
    renderReadme(index, manifest)
  );
  log(`\nDONE: ${index.skills.length} skills, ${(used / 1048576).toFixed(2)} MiB / budget ${(BUDGET_BYTES / 1048576).toFixed(2)} MiB`);
  if (used > PANEL_MAX_ZIP) throw new Error("budget exceeds panel hard cap 32MiB!");
  return index;
}

function sha256(buf) {
  return buf ? createHash("sha256").update(buf).digest("hex") : null;
}

function renderReadme(index, manifest) {
  const byCat = new Map();
  for (const s of index.skills) {
    if (!byCat.has(s.category)) byCat.set(s.category, []);
    byCat.get(s.category).push(s);
  }
  const lines = [
    "# DSH Skills Aggregate",
    "",
    `Auto-generated aggregate skill source for the DSH **Settings → Skills** panel`,
    `(\`@michengai/dsh-skills-manager\`). Add this repository **once** and browse every skill below.`,
    "",
    `- Generated: \`${index.generatedAt}\``,
    `- Skills: **${index.skills.length}** (panel limit 500)`,
    `- Payload: **${(index.usedBytes / 1048576).toFixed(2)} MiB** / 32 MiB panel cap`,
    "",
    "## Add it to DSH",
    "",
    "```text",
    "Settings → Skills → Skill repositories → Add repository",
    `  <owner>/<repo>        # e.g. your-account/dsh-skills-aggregate`,
    "```",
    "",
    "## Sources",
    "",
    "| Upstream | Ref | Category | License |",
    "| --- | --- | --- | --- |",
  ];
  for (const s of manifest.sources) {
    lines.push(`| [${s.owner}/${s.name}](https://github.com/${s.owner}/${s.name}) | \`${s.ref}\` | ${s.category || "misc"} | ${s.license || "unspecified"} |`);
  }
  lines.push("", "## Skills", "");
  for (const [cat, items] of [...byCat.entries()].sort()) {
    lines.push(`### ${cat}`, "", "| Skill | Description | Source |", "| --- | --- | --- |");
    for (const s of items.sort((a, b) => a.name.localeCompare(b.name))) {
      const desc = (s.description || "").replace(/\|/g, "\\|").replace(/\s+/g, " ").slice(0, 140);
      lines.push(`| \`${s.name}\` | ${desc} | [${s.source}](${s.sourceUrl}) |`);
    }
    lines.push("");
  }
  if (index.skipped.length) {
    lines.push("## Skipped", "", `${index.skipped.length} entries skipped (limits, duplicates, invalid frontmatter). See \`index.json\`.`);
  }
  lines.push("", "---", "", "Generated by `scripts/build.mjs`. File contents belong to their upstream authors.");
  return lines.join("\n");
}

// ── CLI ─────────────────────────────────────────────────────────────────────
const SELF = fileURLToPath(import.meta.url);
const here = dirname(SELF);

if (process.argv[1] && (SELF === process.argv[1] || process.argv.includes("--build"))) {
  const manifest = JSON.parse(await readFile(join(here, "..", "manifest.json"), "utf8"));
  const outDir = process.env.AGG_OUT || join(here, "..", "dist");
  const index = await build({ manifest, outDir });
  await writeFile(
    join(dirname(outDir), "build-summary.json"),
    JSON.stringify({ skills: index.skills.length, bytes: index.usedBytes, skipped: index.skipped.length }, null, 2)
  );
}
