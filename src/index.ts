import ts from 'typescript';
import { createProgramForFile } from './program.js';
import { resolvePropsType } from './resolvePropsType.js';
import { extractPropertiesFromType } from './extractProperties.js';
import { resolveUnionBranches } from './handlers/union.js';
import { truncateTypeName } from './utils/truncateTypeName.js';
import { resolveOptions, type ParseOptions, type ResolvedParseOptions } from './options.js';
import type { Documentation, PropDescriptor, UnionBranch } from './types.js';

export type { Documentation, PropDescriptor, UnionBranch } from './types.js';
export type { ParseOptions } from './options.js';

/**
 * Entry point: TS/TSX file path in, Documentation JSON out.
 *
 * `options` lets consumers tune output shape/size — e.g.
 * `{ maxTypeNameLength: 80 }` to raise (or `Infinity` to disable) the
 * default 50-character cap on rendered type-name strings, or
 * `maxDepth` to change how many levels of nested object props get
 * expanded. See {@link ParseOptions}.
 */
export function parse(filePath: string, options?: ParseOptions): Documentation {
  const resolvedOptions = resolveOptions(options);
  const program = createProgramForFile(filePath);
  const sourceFile = program.getSourceFile(filePath);

  if (!sourceFile) {
    throw new Error(`Could not load source file: ${filePath}`);
  }

  const checker = program.getTypeChecker();

  const resolved = resolvePropsType(sourceFile, checker, resolvedOptions);
  if (!resolved) {
    throw new Error(`No "Props" interface or type alias found in: ${filePath}`);
  }
  const { type: topLevelType, contextNode, displayName, docSymbol } = resolved;

  // When the top-level Props type is itself a union of object shapes
  // (`export type InputProps = AProps | BProps | ...`), the flat
  // `props` above is only the *intersection* of all branches — usually
  // just the discriminant, with every variant-specific field (and its
  // jsdoc) missing entirely. That's the exact gap plain react-docgen
  // has, and it's what leaves Storybook's Controls panel showing only
  // one row. `elements` carries the full per-branch breakdown; when
  // present, it's also used to build a *union* (not intersection) flat
  // `props` map below, so every field from every branch shows up in
  // Controls, each keeping its own description where unambiguous.
  const elements = resolveUnionBranches(topLevelType, contextNode, checker, resolvedOptions);

  const props = elements
    ? mergePropsAcrossBranches(elements, resolvedOptions)
    : extractPropertiesFromType(topLevelType, contextNode, checker, 0, resolvedOptions);

  const description = docSymbol
    ? ts.displayPartsToString(docSymbol.getDocumentationComment(checker)).trim() || undefined
    : undefined;

  return {
    displayName,
    description,
    props,
    ...(elements ? { elements } : {}),
  };
}

/**
 * Builds the flat `props` map for a top-level union Props type as the
 * *union* of every branch's own props (not the intersection TypeScript
 * gives you natively) — this is what Storybook's Controls panel and
 * other react-docgen-typescript-shaped consumers read, so it needs to
 * carry every field, not just the shared discriminant.
 *
 * A field present in only one branch keeps that branch's description
 * as-is (no ambiguity). A field present in multiple branches keeps its
 * description only if every branch that has it agrees — otherwise it's
 * dropped rather than concatenated into nonsense, same rule as before.
 * `required` is true only if the field is present and required in
 * every branch; a field that's optional or absent in even one branch
 * isn't safe to treat as always-required.
 */
function mergePropsAcrossBranches(
  elements: UnionBranch[],
  options: ResolvedParseOptions
): Record<string, PropDescriptor> {
  const allNames = new Set<string>();
  for (const branch of elements) {
    for (const name of Object.keys(branch.props)) allNames.add(name);
  }

  const result: Record<string, PropDescriptor> = {};

  for (const name of allNames) {
    const inBranches = elements
      .map((branch) => branch.props[name])
      .filter((p): p is PropDescriptor => p !== undefined);

    const descriptions = new Set(inBranches.map((p) => p.description));
    const defaults = new Set(inBranches.map((p) => JSON.stringify(p.defaultValue)));
    const typeNames = [...new Set(inBranches.map((p) => p.type.name))];
    const required = inBranches.length === elements.length && inBranches.every((p) => p.required);

    result[name] = {
      name,
      required,
      type: { name: truncateTypeName(typeNames.join(' | '), options.maxTypeNameLength) },
      description: descriptions.size === 1 ? [...descriptions][0] : undefined,
      defaultValue: defaults.size === 1 ? inBranches[0]?.defaultValue : undefined,
    };
  }

  return result;
}
