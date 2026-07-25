---
"@rqml/core": minor
"@rqml/cli": minor
"@rqml/mcp": minor
---

`skeleton` covers every authorable element, and says where each one goes

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
