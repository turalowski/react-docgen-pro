import ts from 'typescript';
import type { PropDescriptor } from './types.js';
import { getSymbolDescription, getDefaultValueTag } from './utils/jsdoc.js';
import { resolveUnionBranches } from './handlers/union.js';
import { truncateTypeName } from './utils/truncateTypeName.js';
import { DEFAULT_PARSE_OPTIONS, type ResolvedParseOptions } from './options.js';

/** Summary label shown in place of an inline/unnamed object type's own printed shape — see the comment at its use site below. */
const ANONYMOUS_OBJECT_LABEL = 'Props';

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

    // For an array prop (`tags: Tag[]`), the interesting shape to expand
    // is the *element* type, not the array itself — `checker.
    // getPropertiesOfType` on an array type would just walk Array.prototype
    // (length, push, map, ...), which is exactly the noise consumers
    // don't want surfaced. Array<T>/ReadonlyArray<T> are always generic
    // type references, so their element type is their sole type argument.
    const arrayElementType = checker.isArrayType(propType)
      ? checker.getTypeArguments(propType as ts.TypeReference)[0]
      : undefined;
    const expandableType = arrayElementType ?? propType;

    // A union already gets its own per-branch breakdown via `elements`
    // above; `properties` is for the simpler case of a single nested
    // object shape, e.g. `user: AvatarUser` or `tags: Tag[]`. type.name
    // stays the raw reference ("AvatarUser", "Tag[]") so the type
    // identity is still visible — this is the expanded shape alongside
    // it, not a replacement. For `tags: Tag[]` this is Tag's own
    // properties, not a property named after an array index.
    const properties =
      !elements &&
      expandableType &&
      depth < maxDepth &&
      !seen.has(expandableType) &&
      isExpandableObjectType(expandableType, checker)
        ? extractPropertiesFromType(
            expandableType,
            contextNode,
            checker,
            depth + 1,
            options,
            new Set(seen).add(expandableType)
          )
        : undefined;

    // An inline, unnamed object type (`controls: { visible: boolean; ... }`,
    // as opposed to a named interface/type-alias reference like `user:
    // AvatarUser`) has no real identity to show as a summary — TS's own
    // printed form is just the whole shape crammed onto one line, which
    // truncateTypeName then cuts off mid-field ("{ visible: boolean;
    // label: string; disabl…"). There's nothing useful about that as a
    // *name*, and it duplicates `properties` below anyway, so swap it
    // for a short, generic placeholder instead of truncating it — the
    // real shape is still one click away via `properties`. Keeps the
    // `[]` suffix for an anonymous-object array element so the summary
    // doesn't silently drop that it's a list.
    const isAnonymousObject = !!properties && isAnonymousObjectType(expandableType);
    const typeName = isAnonymousObject
      ? arrayElementType
        ? `${ANONYMOUS_OBJECT_LABEL}[]`
        : ANONYMOUS_OBJECT_LABEL
      : truncateTypeName(checker.typeToString(propType), options.maxTypeNameLength);

    props[symbol.name] = {
      name: symbol.name,
      required,
      type: {
        name: typeName,
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

/**
 * True for an object type with no name to show. A genuinely inline
 * `{ ... }` written directly at the property position still gets a
 * symbol from the checker — it's just the synthetic one every type
 * literal gets, named `ts.InternalSymbolName.Type` ("__type"), not a
 * real declared name — so checking for *a* symbol isn't enough; this
 * checks for a *named* one. `aliasSymbol` is checked separately since
 * `type Foo = { ... }` carries the same symbol-less underlying type but
 * has a real name one level up, via the alias rather than the type
 * itself — both it and a named interface reference print their own
 * name via `checker.typeToString` and should keep it.
 */
function isAnonymousObjectType(type: ts.Type): boolean {
  const symbol = type.getSymbol();
  const hasRealSymbolName = !!symbol && symbol.name !== ts.InternalSymbolName.Type;
  return !hasRealSymbolName && !type.aliasSymbol;
}
