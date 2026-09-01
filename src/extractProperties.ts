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

    // A function-shaped prop (named function type alias, `interface`
    // call signature, or inline `(...) => ...`) — not expanded via
    // `properties` above (isExpandableObjectType excludes call
    // signatures), but its parameters and return type are still worth
    // breaking down, same idea one level in.
    const signature =
      !elements && !properties && expandableType && expandableType.getCallSignatures().length > 0
        ? extractFunctionSignature(expandableType, contextNode, checker, depth, options, seen)
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
        ...(signature?.parameters ? { parameters: signature.parameters } : {}),
        ...(signature?.returnType ? { returnType: signature.returnType } : {}),
      },
      description: getSymbolDescription(symbol, checker),
      ...(defaultValue !== undefined ? { defaultValue: { value: defaultValue } } : {}),
    };
  }

  return props;
}

/**
 * Breaks a function-shaped type's (first) call signature down into its
 * parameters and return type, expanding either the same way a regular
 * object prop is — but only when that type is declared in the user's
 * own project. `checker.getPropertiesOfType` on a param or return type
 * of `MouseEvent` would happily walk lib.dom.d.ts's ~30 fields; nobody
 * asking about their own `onSelect: (event: SelectionEvent) => Result`
 * wants that, but they very much do want `SelectionEvent`'s/`Result`'s
 * own shape expanded since those are theirs.
 *
 * Only the first signature is used — overloaded function types are rare
 * for a props position, and picking one deterministically beats trying
 * to merge/pick among several.
 */
function extractFunctionSignature(
  type: ts.Type,
  contextNode: ts.Node,
  checker: ts.TypeChecker,
  depth: number,
  options: ResolvedParseOptions,
  seen: ReadonlySet<ts.Type>
) {
  const signature = type.getCallSignatures()[0];
  if (!signature) return undefined;

  const expandPart = (partType: ts.Type) => {
    const { maxDepth } = options;
    const properties =
      depth < maxDepth &&
      !seen.has(partType) &&
      isExpandableObjectType(partType, checker) &&
      isUserDefinedType(partType)
        ? extractPropertiesFromType(
            partType,
            contextNode,
            checker,
            depth + 1,
            options,
            new Set(seen).add(partType)
          )
        : undefined;

    return {
      name: truncateTypeName(checker.typeToString(partType), options.maxTypeNameLength),
      ...(properties ? { properties } : {}),
    };
  };

  const parameters =
    signature.parameters.length === 0
      ? undefined
      : signature.parameters.map((paramSymbol) => {
          const paramType = checker.getTypeOfSymbolAtLocation(paramSymbol, contextNode);
          const declaration = paramSymbol.valueDeclaration as ts.ParameterDeclaration | undefined;
          const required = !declaration?.questionToken && !declaration?.initializer;

          return { name: paramSymbol.name, required, type: expandPart(paramType) };
        });

  // Always reported, even for `void`/`undefined`/`any`/`unknown` — the
  // signature isn't complete without it, and a caller reading a
  // function-shaped prop's full type wants to see "=> void" rather than
  // have the return silently vanish. `expandPart` naturally adds no
  // `properties` for these anyway, since none of them are an
  // expandable object shape.
  const returnType = expandPart(checker.getReturnTypeOfSignature(signature));

  return { parameters, returnType };
}

/**
 * True when every declaration of this type's symbol lives outside
 * TypeScript's own bundled lib files (lib.dom.d.ts, lib.es5.d.ts, ...) —
 * that's how a built-in like `MouseEvent` or `Event` is told apart from
 * an interface the user actually wrote, regardless of what it's named.
 * A type with no declarations (an anonymous literal) counts as
 * user-defined — there's nothing built-in about it.
 */
function isUserDefinedType(type: ts.Type): boolean {
  const symbol = type.symbol ?? type.aliasSymbol;
  const declarations = symbol?.getDeclarations();
  if (!declarations || declarations.length === 0) return true;

  return declarations.every((decl) => !isBuiltinLibFile(decl.getSourceFile().fileName));
}

function isBuiltinLibFile(fileName: string): boolean {
  return /[/\\]typescript[/\\]lib[/\\]lib\.[^/\\]+\.d\.ts$/.test(fileName);
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
