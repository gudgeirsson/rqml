/**
 * Schema-valid RQML snippet skeletons (REQ-LOOP-SKELETON). Scope is RQML
 * structure only — generation of target-language code or tests is excluded by
 * design (ISS-LOOP-SCOPE); the snippets exist so authoring tools and agents
 * never emit structurally invalid XML.
 *
 * Every authorable element of the goals, scenarios, catalogs and domain
 * sections has a kind here, because "never invent element shapes" is only a
 * rule an agent can follow if a shape exists for what it needs to write
 * (REQ-LOOP-SKELETON-COVERAGE). Generation is pull-based, so a kind nobody
 * asks for costs nothing.
 */

export type SkeletonKind =
  // requirements · behavior · verification · trace
  | "req"
  | "edge"
  | "testCase"
  | "stateMachine"
  // goals
  | "goal"
  | "qgoal"
  | "obstacle"
  | "goalLink"
  // scenarios
  | "scenario"
  | "misuseCase"
  | "edgeCase"
  // catalogs
  | "term"
  | "actor"
  | "stakeholder"
  | "constraint"
  | "policy"
  | "decision"
  | "risk"
  // domain
  | "entity"
  | "rule";

interface SkeletonSpec {
  /**
   * The parent chain the snippet belongs under, as a path of element names
   * from the document root. Callers surface this so an author knows where to
   * paste; the snippet is only schema-valid in this position.
   */
  readonly section: string;
  readonly defaultId: string;
  readonly template: (id: string) => string;
}

const SPECS = {
  req: {
    section: "requirements",
    defaultId: "REQ-AREA-001",
    template: (
      id,
    ) => `<req id="${id}" type="FR" title="Title" status="draft" priority="must">
  <statement>The system SHALL ...</statement>
  <acceptance>
    <criterion id="${id}-CRIT-1">
      <given>...</given>
      <when>...</when>
      <then>...</then>
    </criterion>
  </acceptance>
</req>`,
  },
  edge: {
    section: "trace",
    defaultId: "E-AREA-001",
    template: (id) =>
      `<edge id="${id}" type="satisfies" from="REQ-AREA-001" to="GOAL-NAME"/>`,
  },
  testCase: {
    section: "verification",
    defaultId: "TC-NAME",
    template: (id) => `<testCase id="${id}" type="unit" title="Title">
  <purpose>...</purpose>
  <steps>...</steps>
  <expected>...</expected>
</testCase>`,
  },
  stateMachine: {
    section: "behavior",
    defaultId: "SM-NAME",
    template: (id) => `<stateMachine id="${id}" name="Name" initial="ST-START">
  <state id="ST-START" name="Start" type="initial"/>
  <state id="ST-DONE" name="Done" type="final"/>
  <transition id="TR-FINISH" from="ST-START" to="ST-DONE" event="finish"/>
</stateMachine>`,
  },

  goal: {
    section: "goals",
    defaultId: "GOAL-NAME",
    template: (id) => `<goal id="${id}" title="Title" priority="must" status="draft">
  <statement>...</statement>
  <rationale>...</rationale>
</goal>`,
  },
  qgoal: {
    section: "goals",
    defaultId: "QGOAL-NAME",
    template: (id) => `<qgoal id="${id}" title="Title" priority="should" status="draft">
  <statement>...</statement>
  <metric>... (a number a test can assert)</metric>
</qgoal>`,
  },
  obstacle: {
    section: "goals",
    defaultId: "OBS-NAME",
    template: (
      id,
    ) => `<obstacle id="${id}" title="Title" likelihood="medium" severity="high">
  <statement>...</statement>
  <mitigation>...</mitigation>
</obstacle>`,
  },
  goalLink: {
    section: "goals",
    defaultId: "GL-NAME",
    template: (id) =>
      `<goalLink id="${id}" from="QGOAL-NAME" to="GOAL-NAME" type="conflictsWith"/>`,
  },

  scenario: {
    section: "scenarios",
    defaultId: "SCN-NAME",
    template: (id) => `<scenario id="${id}" title="Title" actorRef="ACT-NAME">
  <narrative>...</narrative>
</scenario>`,
  },
  misuseCase: {
    section: "scenarios",
    defaultId: "MIS-NAME",
    template: (id) => `<misuseCase id="${id}" title="Title">
  <narrative>... (how the system could be abused, not merely used)</narrative>
</misuseCase>`,
  },
  edgeCase: {
    section: "scenarios",
    defaultId: "EC-NAME",
    template: (id) => `<edgeCase id="${id}" title="Title">
  <narrative>...</narrative>
</edgeCase>`,
  },

  term: {
    section: "catalogs/glossary",
    defaultId: "TERM-NAME",
    template: (id) => `<term id="${id}">
  <name>...</name>
  <definition>...</definition>
</term>`,
  },
  actor: {
    section: "catalogs/actors",
    defaultId: "ACT-NAME",
    template: (id) => `<actor id="${id}" name="Name" type="human">
  <description>...</description>
</actor>`,
  },
  stakeholder: {
    section: "catalogs/stakeholders",
    defaultId: "STK-NAME",
    template: (id) => `<stakeholder id="${id}" name="Name" org="Org">
  <concerns>...</concerns>
</stakeholder>`,
  },
  constraint: {
    section: "catalogs/constraints",
    defaultId: "CON-NAME",
    template: (id) => `<constraint id="${id}" severity="medium">
  <statement>...</statement>
  <source>...</source>
</constraint>`,
  },
  policy: {
    section: "catalogs/policies",
    defaultId: "POL-NAME",
    template: (id) => `<policy id="${id}" source="...">
  <obligation>...</obligation>
  <evidence>... (the artifact an auditor would read)</evidence>
</policy>`,
  },
  decision: {
    section: "catalogs/decisions",
    defaultId: "DEC-NAME",
    template: (id) => `<decision id="${id}" status="approved">
  <context>...</context>
  <decision>... (see ADR-NNNN for the long form)</decision>
  <alternatives>...</alternatives>
  <consequences>...</consequences>
</decision>`,
  },
  risk: {
    section: "catalogs/risks",
    defaultId: "RISK-NAME",
    template: (id) => `<risk id="${id}" severity="medium">
  <statement>...</statement>
  <mitigation>...</mitigation>
</risk>`,
  },

  entity: {
    section: "domain/entities",
    defaultId: "ENT-NAME",
    template: (id) => `<entity id="${id}" name="Name">
  <description>...</description>
  <attr id="${id}-ATTR-1" name="field" type="string" required="true"/>
</entity>`,
  },
  rule: {
    section: "domain/businessRules",
    defaultId: "BR-NAME",
    template: (id) => `<rule id="${id}">
  <statement>... SHALL ...</statement>
  <examples>... (state both sides of the boundary)</examples>
</rule>`,
  },
} as const satisfies Record<SkeletonKind, SkeletonSpec>;

export const SKELETON_KINDS: readonly SkeletonKind[] = Object.keys(
  SPECS,
) as SkeletonKind[];

export interface SkeletonOptions {
  /** Override the placeholder id of the skeleton's root element. */
  id?: string;
}

/**
 * The parent chain a kind's snippet belongs under, as a path of element names
 * from the document root (e.g. `catalogs/glossary`). The snippet is only
 * schema-valid in that position, and with twenty kinds the position is no
 * longer self-evident from the element name.
 */
export function skeletonSection(kind: SkeletonKind): string {
  return SPECS[kind].section;
}

/**
 * Return a schema-valid XML snippet for the given element kind. Inserting the
 * snippet into the section named by {@link skeletonSection} of a valid document
 * keeps it XSD-valid (CRIT-SKELETON-VALID); placeholder references (edge
 * endpoints, machine states, actorRef) still need to be pointed at real ids.
 */
export function skeleton(kind: SkeletonKind, options: SkeletonOptions = {}): string {
  const spec = SPECS[kind];
  return `${spec.template(options.id ?? spec.defaultId)}\n`;
}
