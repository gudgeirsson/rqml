/**
 * REQ-RELEASE-REPIN — the classifier that decides which baselines a release may
 * re-pin on its own authority.
 *
 * This is the safety boundary of the whole mechanism: everything it calls
 * "sanctioned" gets its baseline refreshed by a bot, with no human reading the
 * diff. So the tests care much more about what it refuses than what it allows —
 * CRIT-REPIN-UNSANCTIONED is the criterion that keeps drift detection worth
 * having.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { classifyManifestDiff } from "./repin-release-baselines.mjs";

const diff = (...lines) => ["--- a/package.json", "+++ b/package.json", "@@ -1,5 +1,5 @@", ...lines].join("\n");

test("a pure version bump is sanctioned", () => {
  const verdict = classifyManifestDiff(diff('-  "version": "0.10.0",', '+  "version": "0.11.0",'));
  assert.equal(verdict.sanctioned, true);
});

test("internal @rqml/* dependency pins moving with the release are sanctioned", () => {
  const verdict = classifyManifestDiff(
    diff('-  "version": "0.8.0",', '+  "version": "0.9.0",', '-  "@rqml/schema": "0.2.1",', '+  "@rqml/schema": "0.2.2",'),
  );
  assert.equal(verdict.sanctioned, true);
});

test("an unchanged manifest is trivially sanctioned", () => {
  assert.equal(classifyManifestDiff(diff()).sanctioned, true);
});

// --- what it must refuse (CRIT-REPIN-UNSANCTIONED) ----------------------

test("a new third-party runtime dependency is NOT sanctioned", () => {
  const verdict = classifyManifestDiff(diff('-  "version": "0.10.0",', '+  "version": "0.11.0",', '+  "left-pad": "^1.3.0",'));
  assert.equal(verdict.sanctioned, false);
  assert.match(verdict.reason, /left-pad/, "names what stopped it, so the log is actionable");
});

test("a changed bin entry is NOT sanctioned — REQ-CLI-BINARY pins that fragment", () => {
  const verdict = classifyManifestDiff(diff('-    "rqml": "./dist/index.js"', '+    "rqml": "./dist/cli.js"'));
  assert.equal(verdict.sanctioned, false);
});

test("a removed dependency is NOT sanctioned, even alongside a real bump", () => {
  const verdict = classifyManifestDiff(diff('-  "version": "1.0.0",', '+  "version": "1.0.1",', '-  "libxml2-wasm": "^0.7.1",'));
  assert.equal(verdict.sanctioned, false);
});

test("a lookalike key is not mistaken for the version field", () => {
  // "versionRange" starts with "version" — an anchored-prefix bug would pass it.
  const verdict = classifyManifestDiff(diff('+  "versionRange": ">=1.0.0",'));
  assert.equal(verdict.sanctioned, false);
});

test("a scoped package that is not @rqml/* is NOT sanctioned", () => {
  const verdict = classifyManifestDiff(diff('+  "@types/node": "^20.0.0",'));
  assert.equal(verdict.sanctioned, false);
});
