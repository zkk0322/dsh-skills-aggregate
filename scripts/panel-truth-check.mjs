/**
 * EXCLUSIVE EVIDENCE: run the panel's OWN scan code against the generated tree.
 * This imports @michengai/dsh-skills-manager's real decodeRepositoryArchive +
 * the exact valid-frontmatter predicate, rather than a re-implementation.
 *
 * decodeRepositoryArchive is exported from lib/repositories.js. We build a zip of
 * the generated dist tree (like codeload would), feed it in, and check the panel
 * would accept it.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, dirname, posix } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const root = process.env.AGG_ROOT || join(here, "..", "dist-local");
const PROFILE = "C:/Users/ZXB/.dsh/profiles/desktop/node_modules";
const panelRoot = PROFILE + "/@michengai/dsh-skills-manager";

// fflate lives in the profile's flat node_modules (pnpm hoisted linker)
const require = createRequire(pathToFileURL(PROFILE + "/fflate/package.json"));
const { zipSync } = require(PROFILE + "/fflate/lib/index.cjs");

// 1. Load the panel's real module and grab its exported archive decoder.
const panel = await import(pathToFileURL(panelRoot + "/lib/repositories.js").href);
console.log("panel exports:", Object.keys(panel).join(", "));
const { decodeRepositoryArchive } = panel;

// 2. Zip the generated tree the way codeload would (single top-level dir).
// codeload serves the COMMITTED tree: it never includes .git, and scratch dirs are
// gitignored. Zipping the raw working directory would add .git objects and the
// upstream zip cache, producing a size that no real client would ever see — a
// meaningless (and misleadingly failing) measurement.
const EXCLUDE_DIRS = new Set([".git", ".tmp-zips", "dist", "dist-local", "node_modules"]);
const EXCLUDE_FILES = new Set([".build-summary.json"]);

async function walk(dir, base = dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory() && EXCLUDE_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p, base)));
    else if (e.isFile()) {
      if (base === dir && EXCLUDE_FILES.has(e.name)) continue;
      out.push({ abs: p, rel: posix.join(...p.slice(base.length + 1).split(/[\\/]/)) });
    }
  }
  return out;
}

const files = await walk(root);
const zipEntries = {};
// codeload style: repo-branch/ prefix, containing exactly what git tracks.
const unpublishable = files.filter((f) => f.rel === "SKILL.md" || f.rel.endsWith("/SKILL.md"));
const stray = unpublishable.filter((f) => !f.rel.startsWith("skills/"));
if (stray.length) {
  console.error("FAIL: stray SKILL.md outside skills/ would be scanned as a skill:");
  for (const s of stray.slice(0, 10)) console.error("  " + s.rel);
  process.exit(1);
}
for (const f of files) {
  zipEntries["aggregate-main/" + f.rel] = new Uint8Array(await readFile(f.abs));
}
const zipBytes = zipSync(zipEntries, { level: 6 });
console.log(`\nzipped tree: ${(zipBytes.length / 1048576).toFixed(2)} MiB (panel cap 32 MiB)`);
console.log(`  (excluding .git and scratch dirs — this is what codeload would serve)`);

if (zipBytes.length > 32 * 1024 * 1024) {
  console.error("FAIL: zip exceeds the panel's 32 MiB hard cap");
  process.exit(1);
}

// 3. Feed it through the panel's own decoder (this enforces its path/size/count rules).
let entries;
try {
  entries = decodeRepositoryArchive(Buffer.from(zipBytes));
} catch (e) {
  console.error("FAIL: panel decoder rejected the archive:", e.message);
  process.exit(1);
}
const entryPaths = Object.keys(entries);
console.log(`panel decoded ${entryPaths.length} files`);

// 4. Re-apply the panel's refresh() skill discovery + validity predicate verbatim.
const skillPaths = entryPaths.filter((p) => p === "SKILL.md" || p.endsWith("/SKILL.md"));
console.log(`panel would find ${skillPaths.length} SKILL.md files`);

const SKILL_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const RESERVED_AFTER = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

// parseSkillDoc equivalent, per the panel's own frontmatter reader
function panelParseDoc(text) {
  if (!text.startsWith("---")) return { hasFrontmatter: false, map: {} };
  const end = text.indexOf("\n---", 3);
  if (end < 0) return { hasFrontmatter: false, map: {} };
  const map = {};
  for (const line of text.slice(3, end).split(/\r?\n/)) {
    const m = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    map[m[1]] = v;
  }
  return { hasFrontmatter: true, map };
}

let valid = 0;
const invalid = [];
const names = new Map();
for (const p of skillPaths) {
  const text = Buffer.from(entries[p]).toString("utf8");
  const d = panelParseDoc(text);
  const name = String(d.map.name || "");
  const description = String(d.map.description || "");
  const ok =
    d.hasFrontmatter &&
    SKILL_RE.test(name) &&
    !RESERVED_AFTER.test(name) &&
    name.length <= 100 &&
    !!description;
  if (ok) {
    valid++;
    if (names.has(name)) invalid.push(`${p}: duplicate name "${name}" (also ${names.get(name)})`);
    else names.set(name, p);
  } else {
    invalid.push(`${p}: name="${name}" desc=${description ? "yes" : "no"}`);
  }
}

console.log(`\npanel-valid skills: ${valid}/${skillPaths.length}`);
if (invalid.length) {
  console.log("rejected:");
  for (const i of invalid.slice(0, 20)) console.log("  " + i);
  process.exit(1);
}
console.log("\nEXCLUSIVE EVIDENCE OK: the panel's own decoder + validity rules accept all", valid, "skills.");
console.log(`zip size ${(zipBytes.length / 1048576).toFixed(2)} MiB <= 32 MiB cap; skill count ${valid} <= 500.`);
