import ts from 'typescript';
import type { PropDescriptor } from './types.js';
import { getSymbolDescription, getDefaultValueTag } from './utils/jsdoc.js';
import { resolveUnionBranches } from './handlers/union.js';

/** How many levels of nested object props get expanded into `type.properties`. */
const DEFAULT_MAX_DEPTH = 2;

/**
 * Given the props type node, resolve its type via the checker and
 * walk `checker.getPropertiesOfType`, converting each property symbol
 * into a PropDescriptor. `checker.getPropertiesOfType` already flattens
 * `extends` chains, so no separate extends handler is needed.
 */
export function extractProperties(
  typeNode: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
  checker: ts.TypeChecker
): Record<string, PropDescriptor> {
  const type = checker.getTypeAtLocation(typeNode);
  return extractPropertiesFromType(type, typeNode, checker);
}

/**
 * Same as extractProperties, but takes an already-resolved ts.Type
 * rather than a top-level declaration node. Exists so union.ts can
 * recurse into each branch of a union-of-objects prop and extract
 * that branch's own props the same way we extract a top-level Props
 * interface's props.
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
  maxDepth = DEFAULT_MAX_DEPTH,
  seen: ReadonlySet<ts.Type> = new Set()
): Record<string, PropDescriptor> {
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
    const elements = resolveUnionBranches(propType, contextNode, checker);

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
            maxDepth,
            new Set(seen).add(propType)
          )
        : undefined;

    props[symbol.name] = {
      name: symbol.name,
      required,
      type: {
        name: checker.typeToString(propType),
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
