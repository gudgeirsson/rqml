# @rqml/mcp

## 0.8.0

### Minor Changes

- b73dcbb: Fragment scope: tell "the evidence changed" from "the file around it changed"

  A drift baseline hashes the whole file a locator points at, so a routine version
  bump in `packages/cli/package.json` failed the build on an edge whose declared
  evidence was `#bin`. Four consecutive releases reddened the gate on the same
  three edges, and no re-pin in a full working session caught an unintended
  change — a gate whose red is usually noise teaches its readers to re-pin without
  reading.

  `rqml link` now records the content of a locator's `#fragment` alongside the
  file hash, and `check` reports a file that changed around unchanged evidence as
  `context-changed-implementation`: advisory at every level except `certified`,
  where the whole file is the evidence an auditor reads. The JSON report and
  `rqml_check` gain a `contextChanged` list beside `drift`.

  The whole-file hash is still the detector — fragment scope can only _downgrade_
  an alarm it already raised, never suppress one. Only `.json` fragments are
  interpreted (a member name, `#bin`, or an RFC 6901 pointer, `#/scripts/build`);
  TypeScript, JavaScript and XSD fragments keep whole-file evidence exactly as
  before, and any uncertainty — an unresolvable fragment, a file that stops being
  valid JSON, a member declared twice — is reported as drift. A locator with no
  fragment is never narrowed, so a requirement linked to a whole manifest keeps
  every dependency channel in scope by construction.

  Existing baselines need no migration: a bare sha256 still means whole-file
  scope, and an edge gains fragment scope the next time it is linked or refreshed.
  Refresh only once every gate — CI, editor hooks, global installs — is on this
  version: an older `@rqml/core` treats a fragment-scoped entry as drift rather
  than trusting it, which is the safe direction but turns the gate red until it
  is upgraded.

  `ArtifactStatus` widens by one member, `context-changed`; consumers that switch
  on it exhaustively will want a case for it.

- 89f84c2: `skeleton` covers every authorable element, and says where each one goes

  "Never invent element shapes" is the rule agent guidance gives, and with four
  skeleton kinds it forbade most of the tagset without offering an alternative.
  The elements left uncovered were the ones agent-authored specs stopped using —
  their content reappearing as prose in `<notes>`, where `check`, `matrix` and
  `impact` cannot see it.

  Sixteen kinds join `req`, `edge`, `testCase` and `stateMachine`: `goal`,
  `qgoal`, `obstacle`, `goalLink`, `scenario`, `misuseCase`, `edgeCase`, `term`,
  `actor`, `stakeholder`, `constraint`, `policy`, `decision`, `risk`, `entity`
  and `rule` — every authorable element of the goals, scenarios, catalogs and
  domain sections. Generation is pull-based, so a kind nobody asks for costs
  nothing.

  Each kind now declares the section its snippet is valid in, because with twenty
  kinds "where does this go?" stops being obvious from the element name. New
  `skeletonSection(kind)` in core returns the parent chain (`catalogs/glossary`,
  `domain/businessRules`, …). `rqml skeleton --list` enumerates every kind grouped
  by destination, and an unknown kind prints the same list instead of an
  unreadable twenty-way usage line. `rqml_skeleton` returns `section` beside
  `snippet`.

  CLI standard output is unchanged — the snippet alone, so redirecting into a file
  stays safe. The destination goes to standard error as a hint, and `--json`
  carries it as a field.

  Existing kinds, ids and output are untouched; this is additive.

### Patch Changes

- 8d7a49a: Name the requirements-engineering activity, and the finding rather than the gate

  The AGENTS.md template told agents to "use as much of the RQML tagset as is
  necessary" and left it there. That supplies no occasion for reaching: the
  element families with a CLI writer and a gate read-back get used, and the ones
  without get replaced by prose in `<notes>`, where `check`, `matrix` and `impact`
  cannot see it.

  The template's workflow section now names the ISO/IEC/IEEE 29148 activities each
  of the five stages carries, and its schema guidance replaces the tagset line
  with observable triggers — a boundary number wants `<rule>`/`<examples>`, a
  lifecycle noun wants a `<stateMachine>`, two goals in tension want a
  `conflictsWith` goalLink, a SHALL sitting in a note wants promoting — framed as
  signs to watch for rather than sections to fill. It states plainly that analysis
  raises no finding at all, so a passing check is not read as evidence the
  activity happened.

  Agent-facing text now reports each finding by the artifact it names — the goal
  no requirement satisfies, the requirement with no verification edge, the file
  that changed after its edge was recorded — rather than by the state of the gate,
  and describes drift as a suspect link to re-read rather than a defect. The same
  distinction reaches `rqml validate`'s and `rqml check`'s help text and the
  `rqml_validate` / `rqml_check` MCP descriptions: `rqml validate` performs
  _document_ validation, and requirements validation in the 29148 sense is what a
  person records by approving a requirement — so no passing check attests it.

  Strings only. Command names, JSON keys, rule codes, exit codes and every enum
  are unchanged.

- Updated dependencies [b73dcbb]
- Updated dependencies [89f84c2]
  - @rqml/core@0.9.0

## 0.7.1

### Patch Changes

- Updated dependencies [fdf72c9]
  - @rqml/core@0.8.0

## 0.7.0

### Minor Changes

- d2f9678: Compact trace-edge serialization (RQML 2.2.0, RFC-0003) and generalized `rqml link`.

  - **`rqml link` / `rqml_link`** now record any of the 15 trace types between two
    endpoints (declared id or external URI), auto-orienting implements/verifiedBy,
    stamping `status="draft"` + `createdBy`, and accepting `--notes`/`--confidence`/
    `--tags`. Undeclared bare ids are rejected rather than treated as external.
  - **RQML 2.2.0** makes the compact attribute-form edge (`<edge id type from to/>`)
    the single serialization (−43% edge bytes, lossless). Endpoint values use a
    micro-syntax: bare id = local, `rqml:uri#id` with `;version`/`;git`/`;docId`
    pins = doc, other-scheme URI or schemeless relative path = external.
  - The 2.2.0 schema requires `@from`/`@to`, repairs the identity constraints, and
    drops the (inert) trace keyrefs; referential integrity is processor-enforced.
  - New **`rqml migrate`** rewrites 2.0.1/2.1.0 documents to 2.2.0 in place
    (byte-minimal, comment-safe, drift baselines untouched).

  Breaking: `@rqml/core`'s `LinkRequest` interface changed shape, and the default
  emitted serialization is now the 2.2.0 compact form. Existing documents migrate
  with `rqml migrate`.

### Patch Changes

- Updated dependencies [d2f9678]
  - @rqml/core@0.7.0

## 0.6.1

### Patch Changes

- 596c119: Docs: sync the published `@rqml/cli` and `@rqml/mcp` package READMEs with the
  shipped surface. The CLI README now lists the `rqml lint` command, the
  `--workspace`/`--all` and `--ignore` flags, and the nearest-wins spec resolution;
  the MCP README lists the `rqml_discover` tool and the `file` input. (The READMEs
  are what npm displays; they had drifted behind the 0.6.0/0.7.0 features.)

## 0.6.0

### Minor Changes

- 1ce372d: Monorepo support: nearest-wins spec discovery and workspace fan-out (ADR-0012).

  A repository can host many specs — one per project unit. A file is governed by the
  spec in its nearest ancestor directory; a nested spec takes over its own subtree
  and never governs a parent (no inheritance or merging across specs).

  - **@rqml/core** — new `resolveGoverningSpec` and `discoverSpecs` (pure filesystem,
    no git dependency): resolve the governing spec for any path, and enumerate every
    governing spec beneath a root.
  - **rqml CLI** — resolves the governing spec by walking up from the working
    directory (backward-compatible; `--spec`/`--base-dir` still override), and adds a
    `--workspace`/`--all` mode that runs validate/status/check across every spec with
    one aggregated exit code (`--ignore` to skip directories).
  - **@rqml/mcp** — new `rqml_discover` tool and `file`-based spec resolution, staying
    tools-only.
  - **@rqml/schema** — the bundled `AGENTS.md` template is reworded off the umbrella
    model to the nearest-wins governance model.

### Patch Changes

- Updated dependencies [1ce372d]
  - @rqml/core@0.6.0

## 0.5.0

### Minor Changes

- 5292f71: Add the rest of the interactive-RQML capabilities (2–5).

  - **Spec overview (cap 5):** `@rqml/core` `projectOutline` scopes the document outline by section or id; `rqml overview` (CLI) and `rqml_overview` (MCP) render the whole spec or a subset as markdown + JSON.
  - **Status transition / approve (cap 4):** `@rqml/core` `setStatus` performs a textual, comment-preserving status edit; `rqml approve` (CLI) and `rqml_approve` (MCP) transition a requirement's lifecycle status as an explicit-intent write.
  - **Approval gate (cap 3):** `@rqml/core` `approvalGate` flags implementation linked to non-approved requirements; `rqml gate` (CLI, exit 2 when blocked) and `rqml_gate` (MCP) expose it so editor/agent/CI hooks can block — no language model in the verdict path.
  - **MCP data-plane boundary (cap 2):** the server advertises only the `tools` capability and depends on no optional MCP client feature, keeping every capability reachable on tools-only hosts at CLI parity.
  - The bundled `AGENTS.md` template and the website tooling docs document the new commands and tools.

### Patch Changes

- Updated dependencies [5292f71]
  - @rqml/core@0.5.0

## 0.4.0

### Minor Changes

- 2c75dfd: Add the traceability matrix as a first-class read surface.

  - **@rqml/core**: `buildMatrix(doc, filter?)` derives a per-requirement matrix — status, upstream goals, implementing code, verifying tests, verification/implementation status, and coverage warnings — from the trace graph and coverage report, with `matrixToMarkdown()` and an optional `status`/`type`/`warning` filter. Derived once in the engine so every surface renders one source.
  - **@rqml/cli**: new `rqml matrix` command (markdown or `--json`, with `--status`/`--type`/`--warning` filters).
  - **@rqml/mcp**: new `rqml_matrix` tool returning the matrix as structured data plus a markdown table — at parity with the CLI and tools-only (no resources or elicitation).

### Patch Changes

- Updated dependencies [2c75dfd]
  - @rqml/core@0.4.0

## 0.3.0

### Minor Changes

- ee580a4: Trace links are now maintainable, not just creatable: `rqml link --update`
  repoints an existing edge's external locator (refreshing its drift baseline),
  and `rqml link --refresh <edge-id>` re-records the baseline to bless an
  intentional implementation change — no more hand-editing trace XML or
  baseline.json. The MCP `rqml_link` tool gains the same `update` and `refresh`
  modes, and @rqml/core exports the new `updateTraceEdge` primitive.

### Patch Changes

- 78aaf74: `rqml --version` (and the MCP server's declared version) now report the real
  installed package version instead of a hardcoded constant that went stale on
  release: 0.2.0 shipped while `--version` still printed 0.1.0.
- Updated dependencies [ee580a4]
  - @rqml/core@0.3.0

## 0.2.0

### Minor Changes

- b374d8c: Agent-loop toolchain (PKG-LOOP): `rqml link` records implements/verifiedBy
  trace edges mechanically and captures a drift baseline (`.rqml/baseline.json`)
  so `rqml check` detects changed artifacts, not just missing ones. New
  `rqml show` (single-artifact slice with acceptance criteria and trace
  neighborhood), `rqml impact` (transitive trace traversal), and `rqml skeleton`
  (schema-valid snippets). The core engine now enforces state-machine references
  in `checkIntegrity` (unresolved initial states, dangling transitions, outgoing
  transitions from final states) and reports lifecycle-aware coverage
  (approved-only implementation gap, premature-implementation findings). Every
  MCP tool accepts a `path` input alternative to inline XML, and the server
  gains `rqml_show`, `rqml_impact`, `rqml_skeleton`, and `rqml_link` (explicit
  write). The AGENTS.md template now routes agents to the rqml CLI instead of
  raw xmllint.

### Patch Changes

- Updated dependencies [b374d8c]
  - @rqml/core@0.2.0
