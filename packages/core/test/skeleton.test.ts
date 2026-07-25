import { describe, expect, it } from "vitest";
import { checkIntegrity } from "../src/analyze/integrity.js";
import {
  SKELETON_KINDS,
  type SkeletonKind,
  skeleton,
  skeletonSection,
} from "../src/export/skeleton.js";
import { validate } from "../src/validate/index.js";

/** Top-level sections in the order the schema fixes them. */
const SECTION_ORDER = [
  "catalogs",
  "domain",
  "goals",
  "scenarios",
  "requirements",
  "behavior",
  "verification",
  "trace",
];

/**
 * A document embedding *every* skeleton in the section its own metadata
 * declares. Built from SKELETON_KINDS rather than a hand-written list, so a
 * kind added without a valid section fails this test by construction — the
 * snippets are only useful if they are valid where the tool says to paste them.
 */
function withSkeletons(): string {
  // section path -> snippets, preserving declaration order (which matches the
  // schema's own sequence within each container).
  const bySection = new Map<string, string[]>();
  for (const kind of SKELETON_KINDS) {
    const path = skeletonSection(kind);
    const snippets = bySection.get(path) ?? [];
    snippets.push(skeleton(kind));
    bySection.set(path, snippets);
  }

  const rendered: string[] = [];
  for (const top of SECTION_ORDER) {
    const direct = bySection.get(top);
    const nested = [...bySection].filter(([path]) => path.startsWith(`${top}/`));
    if (!direct && nested.length === 0) continue;
    const body = [
      ...(direct ?? []),
      ...nested.map(([path, snippets]) => {
        const container = path.slice(top.length + 1);
        return `<${container}>\n${snippets.join("")}</${container}>`;
      }),
    ].join("\n");
    rendered.push(`<${top}>\n${body}\n</${top}>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rqml xmlns="https://rqml.org/schema/2.2.0" version="2.2.0" docId="SKEL-1" status="draft">
  <meta><title>t</title><system>s</system></meta>
  ${rendered.join("\n  ")}
</rqml>`;
}

describe("skeleton (REQ-LOOP-SKELETON)", () => {
  it("still covers the four kinds the requirement names", () => {
    for (const kind of ["req", "edge", "testCase", "stateMachine"] as SkeletonKind[]) {
      expect(SKELETON_KINDS).toContain(kind);
    }
  });

  it("covers every element the authoring craft tells agents to write", () => {
    // "Never invent element shapes" is only followable if a shape exists for
    // each element the craft reference documents (REQ-LOOP-SKELETON-COVERAGE).
    for (const kind of [
      "goal",
      "qgoal",
      "obstacle",
      "goalLink",
      "scenario",
      "misuseCase",
      "edgeCase",
      "term",
      "actor",
      "stakeholder",
      "constraint",
      "policy",
      "decision",
      "risk",
      "entity",
      "rule",
    ] as SkeletonKind[]) {
      expect(SKELETON_KINDS).toContain(kind);
    }
  });

  it("every skeleton keeps a document XSD-valid when inserted (CRIT-SKELETON-VALID)", () => {
    const result = validate(withSkeletons());
    expect(result.diagnostics).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("the embedded document passes integrity checking too", () => {
    expect(checkIntegrity(withSkeletons())).toEqual([]);
  });

  it("names a section for every kind, and the section is a real one", () => {
    for (const kind of SKELETON_KINDS) {
      const [top] = skeletonSection(kind).split("/");
      expect(SECTION_ORDER, `${kind} declares an unknown section`).toContain(top);
    }
  });

  it("supports overriding the root id", () => {
    expect(skeleton("req", { id: "REQ-X-9" })).toContain('<req id="REQ-X-9"');
    expect(skeleton("edge", { id: "E-CUSTOM" })).toContain('<edge id="E-CUSTOM"');
    expect(skeleton("term", { id: "TERM-CHUNK" })).toContain('<term id="TERM-CHUNK"');
  });

  it("propagates an overridden id into generated child ids", () => {
    expect(skeleton("entity", { id: "ENT-EXPORT" })).toContain('id="ENT-EXPORT-ATTR-1"');
    expect(skeleton("req", { id: "REQ-X-9" })).toContain('id="REQ-X-9-CRIT-1"');
  });
});
