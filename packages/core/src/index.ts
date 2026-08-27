import ts from 'typescript';
import { createProgramForFile } from './program.js';
import { resolvePropsType } from './resolvePropsType.js';
import { extractProperties } from './extractProperties.js';
import { resolveUnionBranches } from './handlers/union.js';
import type { Documentation, PropDescriptor, UnionBranch } from './types.js';

export type { Documentation, PropDescriptor, UnionBranch } from './types.js';

/**
 * Entry point: TS/TSX file path in, Documentation JSON out.
 *
 * Current scope (matches fixture 01): a single exported `Props`
 * interface/type alias in the file, no extends/union/intersection/
 * generics handling yet. Each of those gets its own handler under
 * ./handlers as the fixture ladder progresses.
 */
export function parse(filePath: string): Documentation {
  const program = createProgramForFile(filePath);
  const sourceFile = program.getSourceFile(filePath);

  if (!sourceFile) {
    throw new Error(`Could not load source file: ${filePath}`);
  }

  const propsTypeNode = resolvePropsType(sourceFile);
  if (!propsTypeNode) {
    throw new Error(`No "Props" interface or type alias found in: ${filePath}`);
  }

  const checker = program.getTypeChecker();

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
  const topLevelType = checker.getTypeAtLocation(propsTypeNode);
  const elements = resolveUnionBranches(topLevelType, propsTypeNode, checker);

  const props = elements
    ? mergePropsAcrossBranches(elements)
    : extractProperties(propsTypeNode, checker);

  const symbol = checker.getSymbolAtLocation(propsTypeNode.name);
  const description = symbol
    ? ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim() || undefined
    : undefined;

  return {
    displayName: propsTypeNode.name.text,
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
function mergePropsAcrossBranches(elements: UnionBranch[]): Record<string, PropDescriptor> {
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
      type: { name: typeNames.join(' | ') },
      description: descriptions.size === 1 ? [...descriptions][0] : undefined,
      defaultValue: defaults.size === 1 ? inBranches[0]?.defaultValue : undefined,
    };
  }

  return result;
}
