/**
 * Toolchain floor invariants — REQ-TOOLCHAIN-FLOOR.
 *
 * The declared floor is the one value host integrations vendor and compare the
 * installed CLI against. Two things can quietly break it:
 *
 *   1. Declaring a floor no published CLI satisfies, which would warn every
 *      user at once with no version they could upgrade to (CRIT-TOOLCHAIN-FLOOR-SANE).
 *   2. Restating the value somewhere else, which is how the floor came to be
 *      declared three different ways before it was centralised
 *      (CRIT-TOOLCHAIN-FLOOR-SINGLE).
 *
 * Publication itself (CRIT-TOOLCHAIN-FLOOR-PUBLISHED) is the copy-assets step,
 * exercised by every site build.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const floorPath = join(root, "integrations/toolchain-floor.json");
const floor = JSON.parse(readFileSync(floorPath, "utf8"));
const cliVersion = JSON.parse(
  readFileSync(join(root, "packages/cli/package.json"), "utf8"),
).version;

const failures = [];

/** Compare two semantic versions; returns <0, 0 or >0. Pre-release tags are ignored. */
function compare(a, b) {
  const parse = (v) => v.split("-")[0].split(".").map(Number);
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  }
  return 0;
}

if (!/^\d+\.\d+\.\d+/.test(floor.cliFloor)) {
  failures.push(`cliFloor "${floor.cliFloor}" is not a semantic version.`);
} else if (compare(floor.cliFloor, cliVersion) > 0) {
  failures.push(
    `cliFloor ${floor.cliFloor} is above the published @rqml/cli ${cliVersion} — ` +
      "no user could satisfy it. Release the CLI before raising the floor.",
  );
}

// The value may appear only in its own declaration. Anything else that names it
// is a second source of truth, which is exactly what this requirement forbids.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".docusaurus",
  ".turbo",
  ".rqml",
  "static",
]);
const TEXT = /\.(json|md|mdx|ts|tsx|js|mjs|cjs|yml|yaml|rqml)$/;
const needle = `"${floor.cliFloor}"`;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) {
      walk(abs);
      continue;
    }
    if (!TEXT.test(entry) || abs === floorPath) continue;
    // Only flag the value where it is presented as a toolchain floor, not every
    // incidental occurrence of the same version string (changelogs, lockfiles).
    const text = readFileSync(abs, "utf8");
    if (text.includes(needle) && /floor|minimum|at least|>=\s*0/i.test(text)) {
      failures.push(
        `${relative(root, abs)} restates the floor ${floor.cliFloor} — derive it from ` +
          "integrations/toolchain-floor.json instead.",
      );
    }
  }
}
walk(root);

if (failures.length > 0) {
  console.error("Toolchain floor check failed:");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `✓ toolchain floor ${floor.cliFloor} is declared once and satisfiable (@rqml/cli ${cliVersion})`,
);
