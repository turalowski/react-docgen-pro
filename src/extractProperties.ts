import ts from 'typescript';
import type { PropDescriptor } from './types.js';
import { getSymbolDescription, getDefaultValueTag } from './utils/jsdoc.js';
import { resolveUnionBranches } from './handlers/union.js';
import { truncateTypeName } from './utils/truncateTypeName.js';
import { DEFAULT_PARSE_OPTIONS, type ResolvedParseOptions } from './options.js';

/**
 * Given an already-resolved ts.Type, walks `checker.getPropertiesOfType`,
 * converting each property symbol into a PropDescriptor.
 * `checker.getPropertiesOfType` already flattens `extends`/intersection
 * chains, so no separate extends/intersection handler is needed. Takes
 * a raw ts.Type (rather than a declaration node) so it works equally
 * for the top-level Props type, each branch of a union.ts split, and a
 * recursive nested-object expansion below.
 *
 * A prop whose type is itself a plain object shape (a named interface
 * reference like `user: AvatarUser`, or an inline object type) gets
 * expanded into `type.properties`, recursively, up to `maxDepth`
 * levels (default 2) — deep enough that an interface-inside-an-
 * interface actually shows its own nested shape, but bounded so a
 * self-referential or very deep type can't blow up the output. `seen`
 * additionally guards against infinite recursion on a type that
 * refers back to one already being expanded in the current chain
 * (e.g. `interface TreeNode { children: TreeNode[] }`).
 */
export function extractPropertiesFromType(
  type: ts.Type,
  contextNode: ts.Node,
  checker: ts.TypeChecker,
  depth = 0,
  options: ResolvedParseOptions = DEFAULT_PARSE_OPTIONS,
  seen: ReadonlySet<ts.Type> = new Set()
): Record<string, PropDescriptor> {
  const { maxDepth } = options;
  const props: Record<string, PropDescriptor> = {};

  for (const symbol of checker.getPropertiesOfType(type)) {
    // Read optionality off the checker-resolved symbol flag, not the
    // original AST declaration's `?` token. For a plain interface prop
    // those agree, but a mapped utility type (Partial<T>, Required<T>,
    // Pick<T, K>, ...) changes optionality on the *resolved* type
    // without touching the original declaration node — checking
    // questionToken there would silently report Partial<T>'s props as
    // required and Required<T>'s props as still optional.
    const required = !(symbol.flags & ts.SymbolFlags.Optional);

    let propType = checker.getTypeOfSymbolAtLocation(symbol, contextNode);
    // Optional props (`foo?: T`) resolve via the checker as `T | undefined`.
    // `required` already conveys optionality, so strip the implicit
    // undefined member to match react-docgen-typescript's convention and
    // avoid redundant noise in the ArgsTable.
    if (!required) {
      propType = checker.getNonNullableType(propType);
    }

    const defaultValue = getDefaultValueTag(symbol, checker);
    const elements = resolveUnionBranches(propType, contextNode, checker, options);

    // A union already gets its own per-branch breakdown via `elements`
    // above; `properties` is for the simpler case of a single nested
    // object shape, e.g. `user: AvatarUser`. type.name stays the raw
    // reference ("AvatarUser") so the type identity is still visible —
    // this is the expanded shape alongside it, not a replacement.
    const properties =
      !elements && depth < maxDepth && !seen.has(propType) && isExpandableObjectType(propType, checker)
        ? extractPropertiesFromType(
            propType,
            contextNode,
            checker,
            depth + 1,
            options,
            new Set(seen).add(propType)
          )
        : undefined;

    props[symbol.name] = {
      name: symbol.name,
      required,
      type: {
        name: truncateTypeName(checker.typeToString(propType), options.maxTypeNameLength),
        ...(elements ? { elements } : {}),
        ...(properties ? { properties } : {}),
      },
      description: getSymbolDescription(symbol, checker),
      ...(defaultValue !== undefined ? { defaultValue: { value: defaultValue } } : {}),
    };
  }

  return props;
}

/**
 * True for a plain object shape worth expanding — a named interface/
 * type-alias reference or an inline object literal type with at least
 * one property, and not a function, array, or other built-in with its
 * own (usually large, uninteresting) property set.
 */
function isExpandableObjectType(type: ts.Type, checker: ts.TypeChecker): boolean {
  if (!(type.getFlags() & ts.TypeFlags.Object)) return false;
  if (type.getCallSignatures().length > 0) return false;

  const symbolName = type.symbol?.name;
  if (symbolName === 'Array' || symbolName === 'ReadonlyArray' || symbolName === 'Date') {
    return false;
  }

  return checker.getPropertiesOfType(type).length > 0;
}
