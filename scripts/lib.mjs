/**
 * Shared logic for both builders (CI api-path and local codeload-path), so that a
 * locally verified tree is byte-for-byte the same shape as what CI publishes.
 *
 * Anything duplicated between build.mjs and build-local.mjs belongs here: the two
 * drifted once already (the local builder silently never wrote SKILLS.md), which
 * meant a local "verification" was not evidence about the CI artifact.
 */

// ── Hard limits mirrored from dsh-skills-manager lib/repositories.js ──────────
export const PANEL_MAX_ZIP = 32 * 1024 * 1024; // LIMIT = 32 << 20
export const PANEL_MAX_SKILLS = 500;
export const PANEL_MAX_SKILL_MD = 256 * 1024;
export const PANEL_MAX_BODY_TOTAL = 4 * 1024 * 1024;
export const PANEL_MAX_FILES_PER_SKILL = 1000;

export const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export const PER_FILE_MAX = 512 * 1024;
export const DROP_EXT =
  /\.(zip|tar|gz|tgz|7z|rar|mp4|mov|avi|mkv|webm|exe|dll|so|dylib|bin|onnx|pt|pth|safetensors|gguf|iso|dmg|msi|jar|wasm)$/i;

/** Path segments that mark test/fixture scaffolding. The panel scans EVERY SKILL.md
 *  in the repo, so nested scaffolding collides with real skill names. */
export const SCAFFOLD_SEG = /(^|\/)(evals?|tests?|__tests__|fixtures?|examples?)(\/|$)/;

/** Repo housekeeping that a vendored project drags along. It carries no skill value
 *  and inflates the payload against the 32 MiB panel cap (observed: one skill shipped
 *  a whole .github/ tree, .editorconfig and pre-commit config). */
export const HOUSEKEEPING_SEG = /(^|\/)(\.github|\.git|\.vscode|\.idea|\.circleci|\.husky)(\/|$)/;
export const HOUSEKEEPING_FILE =
  /(^|\/)(\.editorconfig|\.pre-commit-config\.yaml|\.prettierrc.*|\.eslintrc.*|\.gitignore|\.gitattributes|\.npmignore|\.dockerignore|LICENSE|LICENCE|CHANGELOG\.md|CHANGELOG\.zh-CN\.md|CODE_OF_CONDUCT\.md|CONTRIBUTING\.md|SECURITY\.md|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i;

/** True when a path inside a skill directory is vendored project housekeeping. */
export function isHousekeeping(rel) {
  return HOUSEKEEPING_SEG.test(rel) || HOUSEKEEPING_FILE.test(rel);
}

// ── Frontmatter parsing, identical semantics to the panel ────────────────────
export function parseDoc(text) {
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

/**
 * Remove ONLY the generated outputs. outDir is the repository root by default, so a
 * blanket rm -rf would delete .git and every source file.
 */
export async function cleanOutputs(rm, join, mkdir, outDir) {
  await rm(join(outDir, "skills"), { recursive: true, force: true });
  await rm(join(outDir, "index.json"), { force: true });
  await rm(join(outDir, "SKILLS.md"), { force: true });
  await mkdir(join(outDir, "skills"), { recursive: true });
}

/** Registry of published skill names -> source, shared by both builders. */
export function createNameRegistry() {
  const map = new Map();
  return {
    get: (name) => map.get(name),
    has: (name) => map.has(name),
    set: (name, source, priority) => map.set(name, { source, priority }),
    delete: (name) => map.delete(name),
  };
}

// ── Generated catalogue ─────────────────────────────────────────────────────
export function renderSkillsCatalog(index, manifest) {
  const byCat = new Map();
  for (const s of index.skills) {
    if (!byCat.has(s.category)) byCat.set(s.category, []);
    byCat.get(s.category).push(s);
  }
  const lines = [
    "# DSH Skills Aggregate",
    "",
    "Auto-generated catalogue of the skills published by this repository. Do not edit",
    "by hand — `scripts/build.mjs` rewrites it on every build.",
    "",
    `- Generated: \`${index.generatedAt}\``,
    `- Skills: **${index.skills.length}** (panel limit ${PANEL_MAX_SKILLS})`,
    `- Payload: **${(index.usedBytes / 1048576).toFixed(2)} MiB** / 32 MiB panel cap`,
    "",
    "## Add it to DSH",
    "",
    "```text",
    "Settings → Skills → Skill repositories → Add repository",
    "  <owner>/<repo>",
    "```",
    "",
    "## Sources",
    "",
    "| Upstream | Ref | Category | License |",
    "| --- | --- | --- | --- |",
  ];
  for (const s of manifest.sources) {
    lines.push(
      `| [${s.owner}/${s.name}](https://github.com/${s.owner}/${s.name}) | \`${s.ref}\` | ${s.category || "misc"} | ${s.license || "unspecified"} |`
    );
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

/** Writes index.json + SKILLS.md — the full published surface besides skills/. */
export async function writeCatalogue(writeFile, join, outDir, index, manifest) {
  await writeFile(join(outDir, "index.json"), JSON.stringify(index, null, 2));
  await writeFile(join(outDir, "SKILLS.md"), renderSkillsCatalog(index, manifest));
}
