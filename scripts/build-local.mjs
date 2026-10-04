#!/usr/bin/env node
/**
 * Local (no-API) build path: fetch each upstream as ONE codeload zip and mirror
 * from it. This is exactly what the panel itself does, so it needs no
 * api.github.com quota — only codeload.github.com, which is reachable here.
 *
 * Used to prove the aggregator logic end-to-end on this machine, where
 * api.github.com anonymous is exhausted (60 req/h). CI still uses the API path.
 */
import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { join, dirname, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  PANEL_MAX_SKILLS,
  PANEL_MAX_SKILL_MD,
  PER_FILE_MAX,
  DROP_EXT,
  SCAFFOLD_SEG,
  skillValidity,
  cleanOutputs,
  createNameRegistry,
  writeCatalogue,
} from "./lib.mjs";

const execFileAsync = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));

const BUDGET = Number(process.env.AGG_BUDGET_BYTES || 26 * 1024 * 1024);

// parseDoc / skillValidity live in lib.mjs so both builders judge frontmatter
// identically; `validity` is kept as the local call-site name.
const validity = skillValidity;

const sha256 = (b) => createHash("sha256").update(b).digest("hex");

async function fetchZipTo(owner, name, refs, dest) {
  const attempts = [];
  // codeload intermittently 404s/throttles a ref that works moments later, so each
  // (ref, attempt) pair is retried with backoff instead of failing the whole source.
  for (let round = 0; round < 3; round++) {
    for (const ref of refs) {
      const url = `https://codeload.github.com/${owner}/${name}/zip/${ref}`;
      try {
        const res = await fetch(url, { headers: { "User-Agent": "dsh-skill-agg-local" }, signal: AbortSignal.timeout(300000) });
        if (!res.ok) { attempts.push(`${ref}:HTTP ${res.status}`); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 22 || buf[0] !== 0x50 || buf[1] !== 0x4b) { attempts.push(`${ref}:not a zip`); continue; }
        await writeFile(dest, buf);
        console.log(`  codeload ok ref=${ref} round=${round + 1}`);
        return { bytes: buf.length, ref };
      } catch (e) { attempts.push(`${ref}:${e.message}`); }
    }
    if (round < 2) {
      const wait = 5000 * (round + 1);
      console.log(`  codeload retry in ${wait / 1000}s (${attempts.slice(-2).join(", ")})`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error(attempts.slice(-4).join(" | "));
}

/** Unzip using PowerShell (no external deps); returns extracted root dir. */
async function unzip(zipPath, scratchDir) {
  await rm(scratchDir, { recursive: true, force: true });
  await mkdir(scratchDir, { recursive: true });
  await execFileAsync("powershell", [
    "-NoProfile", "-Command",
    `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${scratchDir}' -Force`,
  ], { timeout: 600000 });
  const { stdout } = await execFileAsync("powershell", [
    "-NoProfile", "-Command",
    `(Get-ChildItem -LiteralPath '${scratchDir}' -Directory | Select-Object -First 1).FullName`,
  ]);
  return stdout.trim();
}

async function walk(dir, base = dir) {
  const { readdir, stat } = await import("node:fs/promises");
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p, base)));
    else if (e.isFile()) {
      const s = await stat(p);
      out.push({ path: p, rel: posix.join(...p.slice(base.length + 1).split(/[\\/]/)), size: s.size });
    }
  }
  return out;
}

const manifest = JSON.parse(await readFile(join(here, "..", "manifest.json"), "utf8"));
// Same output convention as build.mjs: default to the repository root so a local
// run produces exactly what CI would publish. AGG_OUT overrides for scratch runs.
const outDir = process.env.AGG_OUT || join(here, "..");
const tmp = join(here, "..", ".tmp-zips");
await mkdir(tmp, { recursive: true });
// outDir may be the repository root (the CI default), so only the generated outputs
// are cleaned — a blanket rm -rf would delete .git and the sources.
await cleanOutputs(rm, join, mkdir, outDir);

const index = { generatedAt: new Date().toISOString(), budgetBytes: BUDGET, usedBytes: 0, skills: [], skipped: [] };
const names = createNameRegistry();
let used = 0;

for (const src of manifest.sources) {
  const slug = `${src.owner}/${src.name}`;
  console.log(`\n=== ${slug}@${src.ref} (${src.category}) ===`);
  const refs = src.ref && src.ref !== "HEAD" ? [src.ref, "main", "master"] : ["HEAD", "main", "master"];
  const zipPath = join(tmp, `${src.owner}__${src.name}.zip`);
  let got;
  try {
    got = await fetchZipTo(src.owner, src.name, refs, zipPath);
    console.log(`  downloaded ${(got.bytes / 1048576).toFixed(2)} MiB (ref=${got.ref})`);
  } catch (e) {
    console.log(`  SKIP: ${e.message}`);
    index.skipped.push({ source: slug, reason: e.message });
    continue;
  }

  const root = await unzip(zipPath, join(tmp, `${src.owner}__${src.name}`));
  const files = await walk(root);
  console.log(`  extracted ${files.length} files`);

  const skillFiles = files.filter((f) => f.rel === "SKILL.md" || f.rel.endsWith("/SKILL.md"));
  const dirs = [];
  for (const f of skillFiles) {
    const dir = f.rel === "SKILL.md" ? "" : f.rel.slice(0, -"/SKILL.md".length);
    if (src.include?.length && !src.include.some((p) => dir === p || dir.startsWith(p + "/"))) continue;
    if (src.exclude?.some((p) => dir === p || dir.startsWith(p + "/"))) continue;
    // The panel scans EVERY SKILL.md in the repo, so nested fixture/eval trees would
    // both pollute the listing and collide on names. Drop any path segment that
    // looks like test scaffolding, at any depth — not just a leading segment.
    if (/(^|\/)(evals?|tests?|__tests__|fixtures?|examples?)(\/|$)/.test(dir)) continue;
    dirs.push(dir);
  }
  console.log(`  ${dirs.length} candidate skill dirs (of ${skillFiles.length} SKILL.md)`);

  let taken = 0;
  for (const dir of dirs) {
    if (index.skills.length >= PANEL_MAX_SKILLS) { index.skipped.push({ source: slug, path: dir, reason: "500 skill cap" }); continue; }
    const prefix = dir ? dir + "/" : "";
    const mdFile = files.find((f) => f.rel === prefix + "SKILL.md");
    const md = await readFile(mdFile.path, "utf8");
    if (Buffer.byteLength(md, "utf8") > PANEL_MAX_SKILL_MD) { index.skipped.push({ source: slug, path: dir, reason: "SKILL.md > 256KiB" }); continue; }
    const v = validity(md);
    if (!v.ok) { index.skipped.push({ source: slug, path: dir, reason: `invalid frontmatter (name="${v.name}")` }); continue; }

    // Priority: a source may declare `priority` (higher wins) and `overrides` (list of
    // skill names it is allowed to replace). Without this, the first source would
    // permanently shadow every localized/updated variant of the same skill.
    const pr = Number(src.priority || 0);
    const existing = names.get(v.name);
    if (existing && existing.source !== slug) {
      const mayOverride = (src.overrides || []).includes(v.name);
      if (mayOverride) {
        const dropped = index.skills.findIndex((s) => s.name === v.name);
        if (dropped >= 0) {
          const old = index.skills[dropped];
          used -= old.bytes;
          // Remove the SUPERSEDED DIRECTORY FROM DISK TOO. Leaving it behind would make
          // the panel see two skills with the same frontmatter name and reject both.
          await rm(join(outDir, ...old.path.split("/")), { recursive: true, force: true });
          index.skills.splice(dropped, 1);
          names.delete(v.name);
          index.skipped.push({ source: old.source, path: old.path, reason: `superseded by ${slug} (overrides)` });
        }
      } else {
        index.skipped.push({ source: slug, path: dir, reason: `duplicate name "${v.name}" already provided by ${existing.source}` });
        continue;
      }
    }

    const members = files.filter((f) => f.rel.startsWith(prefix) && f.rel !== prefix);
    const plan = [];
    let cost = 0, over = false;
    for (const f of members) {
      const rel = f.rel.slice(prefix.length);
      // Nested scaffolding inside a kept skill (e.g. skill-lifecycle-manager/evals/files/**)
      // carries its own SKILL.md files. The panel scans those too and would hit name
      // collisions, so anything under a test/fixture segment is never copied.
      if (SCAFFOLD_SEG.test(rel)) {
        index.skipped.push({ source: slug, path: posix.join(dir, rel), reason: "nested test/fixture path" });
        continue;
      }
      if (f.size > PER_FILE_MAX) { index.skipped.push({ source: slug, path: posix.join(dir, rel), reason: "asset > 512KiB" }); continue; }
      if (DROP_EXT.test(rel)) { index.skipped.push({ source: slug, path: posix.join(dir, rel), reason: "binary extension" }); continue; }
      cost += f.size;
      if (used + cost > BUDGET) { over = true; break; }
      plan.push([rel, f]);
    }
    if (over || !plan.length) { index.skipped.push({ source: slug, path: dir, reason: over ? "budget" : "no files" }); continue; }

    const { copyFile } = await import("node:fs/promises");
    const target = join(outDir, "skills", src.category || "misc", v.name);
    for (const [rel, f] of plan) {
      const dest = join(target, ...rel.split("/"));
      await mkdir(dirname(dest), { recursive: true });
      await copyFile(f.path, dest);
    }
    used += cost;
    taken++;
    names.set(v.name, slug, pr);
    index.skills.push({
      name: v.name, category: src.category || "misc", description: v.description,
      path: posix.join("skills", src.category || "misc", v.name),
      source: slug, sourceRef: got.ref,
      sourceUrl: `https://github.com/${slug}/tree/${got.ref}/${dir || "."}`,
      license: src.license || null,
      bytes: cost,
    });
  }
  console.log(`  kept ${taken} (total ${index.skills.length}, ${(used / 1048576).toFixed(2)} MiB)`);
}

index.usedBytes = used;
// Same catalogue writer as build.mjs, so a local run yields exactly the CI artifact.
await writeCatalogue(writeFile, join, outDir, index, manifest);
await writeFile(
  join(outDir, ".build-summary.json"),
  JSON.stringify({ skills: index.skills.length, bytes: index.usedBytes, skipped: index.skipped.length }, null, 2)
);
console.log(`\nDONE: ${index.skills.length} skills, ${(used / 1048576).toFixed(2)} MiB, skipped ${index.skipped.length}`);
console.log(`out: ${outDir}`);
