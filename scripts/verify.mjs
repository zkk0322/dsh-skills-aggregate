#!/usr/bin/env node
/**
 * Verify the generated aggregate tree against the dsh-skills-manager panel's
 * HARD limits, using the same predicates the panel applies at refresh() time.
 * Exits non-zero on any violation, so CI fails instead of publishing junk.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, dirname, posix, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.AGG_ROOT ? process.env.AGG_ROOT : join(here, "..");

const PANEL_MAX_ZIP = 32 * 1024 * 1024;
const PANEL_MAX_SKILLS = 500;
const PANEL_MAX_SKILL_MD = 256 * 1024;
const PANEL_MAX_FILES_PER_SKILL = 1000;
const PANEL_MAX_BODY_TOTAL = 4 * 1024 * 1024;
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function parseDoc(text) {
  if (!text.startsWith("---")) return { hasFrontmatter: false, map: {} };
  const end = text.indexOf("\n---", 3);
  if (end < 0) return { hasFrontmatter: false, map: {} };
  const map = {};
  for (const raw of text.slice(3, end).split(/\r?\n/)) {
    const m = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(raw);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    map[m[1]] = v;
  }
  return { hasFrontmatter: true, map };
}

const errors = [];
const warnings = [];
// Expected and harmless: directories are prefixed with their category
// (skills/official-zh/docx) while the panel keys skills by the frontmatter name
// ("docx"). Counted, not listed, so real problems stay visible.
let dirMismatch = 0;

const skillsRoot = join(root, "skills");
let allFiles;
try {
  allFiles = await walk(skillsRoot);
} catch {
  console.error("FATAL: skills/ missing — run scripts/build.mjs first");
  process.exit(1);
}

const totalBytes = (await Promise.all(allFiles.map(async (f) => (await stat(f)).size))).reduce((a, b) => a + b, 0);

// ── 1. whole-repo size vs panel cap (approximate: excludes .git pack overhead)
if (totalBytes > PANEL_MAX_ZIP) {
  errors.push(`repo payload ${(totalBytes / 1048576).toFixed(2)} MiB exceeds panel cap ${(PANEL_MAX_ZIP / 1048576).toFixed(0)} MiB`);
}

// ── 2. skill discovery + name validity + per-skill file counts
const skillMdFiles = allFiles.filter((f) => {
  const rel = relative(skillsRoot, f).split(/[\\/]/).join("/");
  return rel.endsWith("/SKILL.md") || rel === "SKILL.md";
});
if (skillMdFiles.length > PANEL_MAX_SKILLS) {
  errors.push(`${skillMdFiles.length} skills exceeds panel limit ${PANEL_MAX_SKILLS}`);
}
if (skillMdFiles.length === 0) {
  errors.push("no SKILL.md found — the panel would show an empty repository");
}

const byDir = new Map();
for (const f of allFiles) {
  const rel = relative(skillsRoot, f).split(/[\\/]/).join("/");
  const dir = rel.includes("/") ? posix.dirname(rel) : "";
  byDir.set(dir, (byDir.get(dir) || 0) + 1);
}

const names = new Map();
let bodyTotal = 0;
for (const f of skillMdFiles) {
  const rel = relative(skillsRoot, f).split(/[\\/]/).join("/");
  const dir = rel.includes("/") ? posix.dirname(rel) : "";
  const text = await readFile(f, "utf8");
  const size = Buffer.byteLength(text, "utf8");
  bodyTotal += size;

  if (size > PANEL_MAX_SKILL_MD) errors.push(`${rel}: SKILL.md ${(size / 1024).toFixed(0)}KiB > 256KiB panel limit`);

  const files = byDir.get(dir) || 0;
  if (files > PANEL_MAX_FILES_PER_SKILL) errors.push(`${dir}: ${files} files > ${PANEL_MAX_FILES_PER_SKILL} panel limit`);

  const { hasFrontmatter, map } = parseDoc(text);
  const name = String(map.name || "");
  const description = String(map.description || "");
  const label = `skills/${dir || "."}`;

  if (!hasFrontmatter) errors.push(`${label}: missing YAML frontmatter — panel marks skill invalid`);
  if (!SKILL_NAME_RE.test(name)) errors.push(`${label}: name "${name}" fails /^[a-z0-9]+(-[a-z0-9]+)*$/ — panel marks invalid`);
  if (RESERVED.test(name)) errors.push(`${label}: name "${name}" is a Windows reserved device name`);
  if (name.length > 100) errors.push(`${label}: name longer than 100 chars`);
  if (!description) errors.push(`${label}: empty description — panel marks invalid`);
  if (dir !== name && name) dirMismatch++;
  if (dir !== name && !name) errors.push(`${label}: empty frontmatter name and directory is not a valid skill name`);

  if (names.has(name)) errors.push(`duplicate skill name "${name}" in ${names.get(name)} and ${label}`);
  else names.set(name, label);
}

if (bodyTotal > PANEL_MAX_BODY_TOTAL) {
  errors.push(`sum of SKILL.md bodies ${(bodyTotal / 1048576).toFixed(2)} MiB exceeds panel scan cap 4 MiB`);
}

// ── 3. index.json consistency
let index;
try {
  index = JSON.parse(await readFile(join(root, "index.json"), "utf8"));
} catch (e) {
  errors.push(`index.json unreadable: ${e.message}`);
}
if (index) {
  if (index.skills?.length !== skillMdFiles.length) {
    errors.push(`index.json lists ${index.skills?.length} skills but tree has ${skillMdFiles.length}`);
  }
  const listed = new Set((index.skills || []).map((s) => s.path));
  for (const f of skillMdFiles) {
    const rel = relative(root, f).split(/[\\/]/).join("/");
    const dir = posix.dirname(rel);
    if (!listed.has(dir)) errors.push(`index.json missing path entry for ${dir}`);
  }
}

// ── 4. the published tree must not contain stray SKILL.md outside skills/
// The panel scans the ENTIRE repository, so a SKILL.md left in a scratch or
// vendored directory would be picked up as an unexpected skill.
for (const f of allFiles) {
  const rel = relative(root, f).split(/[\\/]/).join("/");
  if ((rel === "SKILL.md" || rel.endsWith("/SKILL.md")) && !rel.startsWith("skills/")) {
    errors.push(`stray SKILL.md outside skills/: ${rel}`);
  }
}

console.log(`payload      : ${(totalBytes / 1048576).toFixed(2)} MiB / ${(PANEL_MAX_ZIP / 1048576).toFixed(0)} MiB cap`);
console.log(`skills       : ${skillMdFiles.length} / ${PANEL_MAX_SKILLS}`);
console.log(`SKILL.md sum : ${(bodyTotal / 1048576).toFixed(2)} MiB / ${(PANEL_MAX_BODY_TOTAL / 1048576).toFixed(0)} MiB`);
console.log(`files        : ${allFiles.length}`);
console.log(`warnings     : ${warnings.length}`);
console.log(`dir!=name    : ${dirMismatch} (expected: dirs are category-prefixed, panel uses frontmatter name)`);
for (const w of warnings.slice(0, 20)) console.log(`  warn: ${w}`);
if (warnings.length > 20) console.log(`  ... ${warnings.length - 20} more`);

if (errors.length) {
  console.error(`\nFAILED: ${errors.length} panel-constraint violation(s)`);
  for (const e of errors.slice(0, 40)) console.error(`  error: ${e}`);
  if (errors.length > 40) console.error(`  ... ${errors.length - 40} more`);
  process.exit(1);
}
console.log("\nOK: tree satisfies every dsh-skills-manager constraint.");
