<p align="center">
  <img src="https://rqml.org/img/RQML_logo_transparent.png" alt="RQML Logo" width="280">
</p>

<p align="center">
  <em>Requirements Markup Language — an open format for requirements, plus a deterministic toolchain</em>
</p>

<h1 align="center">Agents drift from the spec. RQML fails the build.</h1>

<p align="center">
  Your agent drafts the spec. <code>rqml link</code> pins each requirement to the code and
  tests that realize it. When they drift apart, <code>rqml check</code> fails the build —
  and, with the plugins, the agent's turn. <strong>No language model in the verdict
  path.</strong>
</p>

<p align="center">
  <strong>Built for codebases where an agent writes much of the code</strong> — and someone
  still has to know what the system is supposed to do.
</p>

<p align="center">
  <a href="https://rqml.org/docs/quick-start">Quick Start</a> •
  <a href="https://rqml.org/docs/tooling">Tooling</a> •
  <a href="https://rqml.org/docs/user-guide">User Guide</a> •
  <a href="https://rqml.org/docs/reference">Reference</a> •
  <a href="https://rqml.org/docs/examples">Examples</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/schema-2.2.0-8568ab" alt="Schema version">
  <img src="https://img.shields.io/npm/v/@rqml/cli?label=%40rqml%2Fcli&color=8568ab" alt="@rqml/cli on npm">
  <img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License">
</p>

<p align="center">
  <sub>Apache-2.0 · open schema · fully offline · no server, no API keys · works with any coding agent</sub>
</p>

---

One command scaffolds a spec and an `AGENTS.md`:

```bash
npx @rqml/cli init
```

## Six weeks later, the agent quietly rewrote auth. `rqml check` noticed.

Spec-driven tools like Spec Kit and Kiro get you a spec. RQML makes it binding:

```console
$ rqml show REQ-AUTH-001
## REQ-AUTH-001 — Verify session tokens
kind: req (FR) · status: approved · priority: must

The API MUST reject any request whose session token fails signature
verification, with status 401.

# the agent implements it, then records the link — no hand-edited XML
$ rqml link REQ-AUTH-001 src/auth.ts#verifyToken
✓ REQ-AUTH-001 ← src/auth.ts#verifyToken (E-IMPL-AUTH-001, implements, baseline recorded)

$ rqml check
✓ check pass (standard) — requirements.rqml

# six weeks later, an agent refactors auth without touching the spec…
$ rqml check
  error (drift) [changed-implementation]: implements edge "E-IMPL-AUTH-001"
    points at "src/auth.ts#verifyToken", which has changed since approval.
✗ check fail (standard) — requirements.rqml      (exit 2)
```

**No AI checks the AI — a checksum does.** Drift means pinned code changed and nobody
re-reviewed the link; the gate forces a look. `rqml check` is a pure function of your
repository — same input, same verdict, on your laptop and in CI. The model proposes; the
toolchain disposes.

## Start in three steps

A useful spec fits on one screen; a serious one scales to thousands of requirements with
goals, scenarios, state machines, and a typed traceability graph.

1. **Scaffold** — `npx @rqml/cli init` drops a `requirements.rqml` and an
   [`AGENTS.md`](https://rqml.org/AGENTS.md) in your project root (with a strictness level
   from `relaxed` to `certified`).
2. **Check** — `npx @rqml/cli check` validates the schema, checks that every requirement is
   linked to code and tests, and catches implementation drift.
3. Develop with your **coding agent of choice** — it works from the spec, records trace
   links with `rqml link`, and you gate CI with `rqml check`.

A complete, valid spec is small:

```xml
<rqml xmlns="https://rqml.org/schema/2.2.0"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="https://rqml.org/schema/2.2.0 https://rqml.org/schema/rqml-2.2.0.xsd"
      version="2.2.0" docId="DOC-HELLO-001" status="draft">
  <meta>
    <title>Hello World CLI</title>
    <system>hello</system>
  </meta>
  <requirements>
    <req id="REQ-HELLO-001" type="FR" title="Print greeting" status="draft" priority="must">
      <statement>
        The program MUST print "Hello, world!" to standard output
        and exit with status code 0.
      </statement>
    </req>
  </requirements>
</rqml>
```

The header boilerplate is scaffolded by `rqml init` and maintained by your agent — what you
review is the `statement`.

**Tip:** `rqml skeleton` keeps the structure valid while your agent drafts, and the
[Claude Code and Codex plugins](#drop-it-into-your-coding-agent) run the whole loop for you.

And in CI:

```yaml
- run: npx @rqml/cli check --strictness standard
```

Exit codes are stable: `0` pass · `1` validation failure · `2` blocking drift or
coverage · `64` usage error.

## Drop it into your coding agent

The **Claude Code** and **Codex** plugins run the whole loop for you: every session opens
anchored on your spec, every edit is validated in the same turn, and the turn is gated on
`rqml check` — the same verdict your CI runs.

**[Claude Code plugin](https://github.com/rqml-org/rqml-claude)** — anchor, validate, and
gate Claude in every session. Six `/rqml:*` commands for the Spec → Design → Plan → Code →
Verify workflow, plus the bundled MCP tools and an RQML authoring skill.

```text
npm install -g @rqml/cli
# then, inside Claude Code:
/plugin marketplace add rqml-org/rqml-claude
/plugin install rqml@rqml
```

**[Codex plugin](https://github.com/rqml-org/rqml-codex)** — the same loop for OpenAI
Codex: session anchoring, in-turn spec validation, and a stop-time `rqml check` gate.

```text
npm install -g @rqml/cli
# then, inside Codex:
codex plugin marketplace add rqml-org/rqml-codex
# enable the RQML entry, then trust its hooks
```

On a different host? The [RQML Agent Skill](https://github.com/rqml-org/rqml-skill) brings
the same workflow to any skill-compatible agent, and the
[VS Code extension](https://marketplace.visualstudio.com/items?itemName=rqml.rqml-vscode)
adds in-editor authoring and export. Plugins enforce; these assist. Any other MCP-capable
agent can point straight at the server:

```json
{ "mcpServers": { "rqml": { "command": "npx", "args": ["-y", "@rqml/mcp"] } } }
```

## One engine, every surface

One open-source engine — Apache-2.0, published on npm, no telemetry — powers the CLI, an
MCP server, and the agent plugins, so they can never disagree about what a valid, covered,
drift-free spec is. Everything runs offline, and no model sits in the verdict path.

The loop an agent runs — read one requirement, check the blast radius, implement, record the
link, pass the gate:

```bash
rqml show REQ-PAY-001     # one requirement: statement, acceptance criteria, trace neighborhood
rqml impact REQ-PAY-001   # what is affected, transitively, if this changes?
rqml link REQ-PAY-001 src/payments/capture.ts   # implements edge + content-hash baseline
rqml link REQ-PAY-001 test/payments.test.ts --type verifiedBy
rqml check                # validation + coverage + drift; exit 0 or it isn't done
```

This `show` → `impact` → implement → `link` → `check` rhythm is the **Code** and **Verify**
half of RQML's [five-stage development process](https://rqml.org/docs/development-process)
(Spec → Design → Plan → Code → Verify) — where design decisions are recorded as ADRs in
`.rqml/adr/` and the implementation plan lives in `.rqml/plan.md`.

Under the hood it's four npm packages:

| Package | Install | What it does |
|---------|---------|--------------|
| **[`@rqml/cli`](https://rqml.org/docs/tooling/cli)** (`rqml`) | `npm i -g @rqml/cli` | `init` · `validate` · `status` · `check`, plus the agent loop: `show` · `overview` · `impact` · `matrix` · `link` · `approve` · `gate` · `skeleton` |
| **[`@rqml/core`](https://rqml.org/docs/tooling/core)** | `npm i @rqml/core` | The engine: parse, validate (XSD + referential integrity), lint, trace, impact, coverage, drift, comment-preserving spec edits |
| **[`@rqml/mcp`](https://rqml.org/docs/tooling/mcp)** | `npx @rqml/mcp` | Thirteen [MCP](https://modelcontextprotocol.io) tools for coding agents (`rqml_show`, `rqml_overview`, `rqml_matrix`, `rqml_approve`, `rqml_gate`, `rqml_check`, …) — reads specs by path, writes only on explicit intent |
| **[`@rqml/schema`](https://rqml.org/docs/reference)** | `npm i @rqml/schema` | The canonical XSDs, examples, and the AGENTS.md template — the single source of truth |

## It eats its own dog food

This repository is specified in RQML. [`requirements.rqml`](requirements.rqml) defines the
language and the toolchain as more than 100 requirements; every shipped feature was specified before
it was built, is linked to the code that implements it and the tests that verify it, and the
repo gates its own CI with `rqml check`. The
[Claude Code plugin](https://github.com/rqml-org/rqml-claude) was built the same way — and
once installed, it enforces its own development.

Need requirement-to-test traceability you can show an auditor? The trace graph is plain XML
in your repo — the VS Code extension renders it as a traceability map and exports documents.

The name is older than you might guess: RQML began as an XML DTD in a 2000 MSc thesis at the
University of York. 2.x is a ground-up redesign of that idea for coding agents.
[The origin story →](https://rqml.org/docs/faq)

## Yes, XML — deliberately

Requirements are documents, not data records — prose with structure woven through it — and
mixed content is the problem XML actually solves; JSON and YAML cannot represent it. XML is
boring in useful ways: schemas, namespaces, comments, deterministic validation, clean diffs.
It is also what the model vendors already tell you to do: Anthropic, Google, and AWS all
recommend XML tags for structuring LLM context. RQML is that advice taken seriously — a
schema-validated vocabulary instead of ad-hoc tags. The closing tags cost tokens once; the
structure pays rent for the life of the project.
[The longer argument →](https://rqml.org/why-xml)

## What RQML is not

- **Not a code generator.** It never writes your code — your agent does that. RQML is what
  keeps the agent honest.
- **Not AI-powered.** No model runs in the verdict path. Verdicts are reproducible functions
  of your repo.
- **Not a platform.** Plain files in your repo and a small npm package — no server, no
  dashboard, no account.
- **Not ceremony.** `meta` plus one requirement is a valid spec. Everything else (goals,
  scenarios, domain, behavior, interfaces, verification, trace, governance, catalogs) is
  optional and added when it earns its keep.

## Repository structure

```
rqml/
├── packages/
│   ├── schema/        # @rqml/schema — canonical XSDs, examples, AGENTS.md
│   ├── core/          # @rqml/core   — the engine (parse, validate, trace, check)
│   ├── cli/           # @rqml/cli    — the `rqml` command
│   └── mcp/           # @rqml/mcp    — Model Context Protocol server
├── apps/
│   └── website/       # Docusaurus documentation site → rqml.org
├── integrations/      # The shared toolchain floor the plugins publish against
├── rfc/               # Design proposals and decisions
└── requirements.rqml  # RQML, specified in RQML (the ultimate dogfood)
```

## Documentation

Full documentation lives at **[rqml.org](https://rqml.org)**: the
[Quick Start](https://rqml.org/docs/quick-start), the
[User Guide](https://rqml.org/docs/user-guide), the complete
[Tooling](https://rqml.org/docs/tooling) and
[Reference](https://rqml.org/docs/reference) docs, and
[real-world examples](https://rqml.org/docs/examples).

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
Bugs and suggestions: [open an issue](https://github.com/rqml-org/rqml/issues).
Significant changes go through an RFC in [`rfc/`](rfc/). This repo holds itself to its own
gate: features start as requirements in `requirements.rqml`, and `rqml check` must pass
before you're done. (Yes, really. The gate will tell you.)

## License

[Apache License 2.0](LICENSE).
