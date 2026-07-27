/**
 * Re-pin the drift baselines a release bump invalidates — REQ-RELEASE-REPIN.
 *
 * Package manifests carry implements baselines, so `changeset version` reliably
 * turns main red on a change nobody made by hand. This has been repaired
 * manually after 0.9.0, 0.9.1, 0.10.0 and 0.11.0 — the automation that breaks
 * the baseline should mend it.
 *
 * Runs immediately after `changeset version`, while the bump is still uncommitted,
 * so the re-pin lands in the same Version Packages commit.
 *
 * The discipline is scope. Only edges whose pinned artifact this bump modified
 * are re-pinned, and only when that artifact's diff is confined to the version
 * field and internal @rqml/* dependency pins. Anything else is a change someone
 * should read, so it stays drifted and the gate keeps reporting it — a baseline
 * refreshed without reading is worse than a red gate.
 *
 * `--dry-run` reports what it would do and changes nothing.
 */
import { execFileSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = resolve(new URL("..", import.meta.url).pathname);

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1024 * 1024 * 16 });
}

/**
 * Whether a manifest's diff is confined to what a release bump legitimately
 * rewrites: the package's own version, and the pinned versions of sibling
 * @rqml/* packages. Returns "sanctioned", or a reason it is not.
 */
export function classifyManifestDiff(diff) {
  const changed = diff
    .split("\n")
    .filter((line) => /^[+-]/.test(line) && !/^(\+\+\+|---)/.test(line))
    .map((line) => line.slice(1).trim());

  if (changed.length === 0) return { sanctioned: true, reason: "unchanged" };

  const allowed = /^"(version|@rqml\/[a-z-]+)":/;
  const offending = [...new Set(changed.filter((line) => !allowed.test(line)))];
  if (offending.length > 0) {
    // Name every offending line (capped): inserting a key shifts its neighbours,
    // so the first one is often not the interesting one.
    const shown = offending.slice(0, 3).join(" | ");
    const more = offending.length > 3 ? ` (+${offending.length - 3} more)` : "";
    return { sanctioned: false, reason: `changes beyond the version and @rqml/* pins: ${shown}${more}` };
  }
  return { sanctioned: true, reason: "version and @rqml/* pins only" };
}

/** Package manifests this bump modified, mapped to their repo-relative paths. */
function bumpedManifests() {
  const names = git(["diff", "HEAD", "--name-only"])
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line === "package.json" || line.endsWith("/package.json"));
  return new Set(names);
}

/**
 * Edges the shipped engine reports as stale, `[{edgeId, uri}]`.
 *
 * Both lists matter. `drift` is the blocking kind. `contextChanged` is the
 * fragment-scoped downgrade (ADR-0018): the file moved but the named fragment
 * did not, so it only warns — but it warns on every release until the hash is
 * re-recorded, which is exactly the recurring noise this exists to end.
 */
function staleEdges() {
  let stdout = "";
  try {
    // check exits 2 on drift — the case we are here to handle — so a non-zero
    // status must not abort the script.
    stdout = execFileSync("node", ["packages/cli/dist/index.js", "check", "--json"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch (err) {
    stdout = err.stdout ?? "";
  }
  try {
    const report = JSON.parse(stdout);
    return [
      ...(Array.isArray(report.drift) ? report.drift : []),
      ...(Array.isArray(report.contextChanged) ? report.contextChanged : []),
    ];
  } catch {
    return [];
  }
}

function main() {
  const bumped = bumpedManifests();
  if (bumped.size === 0) {
    console.log("• no package manifests changed — nothing to re-pin.");
    return;
  }

  // Classify each bumped manifest once; an unsanctioned one taints every edge
  // pinned to it.
  const verdicts = new Map();
  for (const path of bumped) {
    verdicts.set(path, classifyManifestDiff(git(["diff", "HEAD", "--", path])));
  }

  const repinned = [];
  const skipped = [];

  for (const { edgeId, uri } of staleEdges()) {
    // Locators may carry a fragment (`path#symbol`); the manifest is the path part.
    const path = relative(ROOT, resolve(ROOT, uri.split("#")[0]));
    if (!bumped.has(path)) {
      skipped.push(`${edgeId} (${path}) — not touched by this bump`);
      continue;
    }
    const verdict = verdicts.get(path);
    if (!verdict.sanctioned) {
      skipped.push(`${edgeId} (${path}) — ${verdict.reason}`);
      continue;
    }
    if (!DRY_RUN) {
      execFileSync("node", ["packages/cli/dist/index.js", "link", "--refresh", edgeId], {
        cwd: ROOT,
        encoding: "utf8",
      });
    }
    repinned.push(`${edgeId} (${path})`);
  }

  const verb = DRY_RUN ? "would re-pin" : "re-pinned";
  if (repinned.length === 0) console.log("• no baselines needed re-pinning for this bump.");
  for (const entry of repinned) console.log(`✓ ${verb} ${entry}`);
  // Left-alone drift is reported, never silently swallowed: it is what the gate
  // will still fail on, and someone has to read it.
  for (const entry of skipped) console.log(`• left drifted: ${entry}`);
}

// Importable for its classifier without running the release side effects.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
