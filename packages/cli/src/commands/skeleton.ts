import { SKELETON_KINDS, type SkeletonKind, skeleton, skeletonSection } from "@rqml/core";
import { EXIT, UsageError, flagString, parseArgs } from "../runtime.js";

/**
 * Kinds grouped by the section they belong under, in the order the schema
 * fixes the sections. Twenty kinds do not fit on a usage line, so both the
 * listing and the unknown-kind error show them by destination — which is also
 * the question an author has when reaching for one.
 */
function bySection(): Map<string, SkeletonKind[]> {
  const grouped = new Map<string, SkeletonKind[]>();
  for (const kind of SKELETON_KINDS) {
    const section = skeletonSection(kind);
    grouped.set(section, [...(grouped.get(section) ?? []), kind]);
  }
  return grouped;
}

function formatKinds(): string {
  return [...bySection()]
    .map(([section, kinds]) => `  ${section.padEnd(22)} ${kinds.join(", ")}`)
    .join("\n");
}

/**
 * `rqml skeleton` — print a schema-valid RQML snippet (REQ-LOOP-SKELETON) so
 * authors and agents never hand-roll invalid structure. `--list` names every
 * kind and where its snippet belongs (REQ-LOOP-SKELETON-COVERAGE).
 */
export async function runSkeleton(rest: string[]): Promise<number> {
  const args = parseArgs(rest);
  const kind = args.positionals[0];

  if (args.flags.get("list") === true || args.flags.get("list") === "true") {
    process.stdout.write(
      `Snippet kinds, by the section they belong under:\n${formatKinds()}\n`,
    );
    return EXIT.OK;
  }

  if (kind === undefined || !(SKELETON_KINDS as readonly string[]).includes(kind)) {
    const what = kind === undefined ? "" : `unknown kind "${kind}"\n`;
    throw new UsageError(
      `${what}usage: rqml skeleton <kind> [--id <id>]\n${formatKinds()}`,
    );
  }

  const id = flagString(args, "id");
  const typed = kind as SkeletonKind;
  if (args.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          kind: typed,
          section: skeletonSection(typed),
          snippet: skeleton(typed, id !== undefined ? { id } : {}),
        },
        null,
        2,
      )}\n`,
    );
    return EXIT.OK;
  }

  // stdout stays exactly the snippet, so redirecting it into a file is safe;
  // the destination goes to stderr as a hint, where it reaches a reader without
  // becoming part of the artifact. `--json` carries it as a field instead.
  process.stdout.write(skeleton(typed, id !== undefined ? { id } : {}));
  process.stderr.write(`belongs under: ${skeletonSection(typed)}\n`);
  return EXIT.OK;
}
