import ts from 'typescript';

export interface ResolvedPropsType {
  type: ts.Type;
  /** Node to resolve individual prop symbols' types/locations against. */
  contextNode: ts.Node;
  displayName: string;
  /**
   * Symbol to read the top-level jsdoc description from — the *local*
   * type reference's own symbol, not necessarily `type.symbol`/
   * `type.aliasSymbol`. Those reflect whatever the resolved type's
   * own definition is, which for something like `Partial<FullUserFields>`
   * is TypeScript's *built-in* `Partial` alias — picking up its doc
   * comment ("Make all properties in T optional") would be wrong. This
   * is resolved from the actual identifier as written at the reference
   * site (or the declaration site, for the bare-fallback case), which
   * correctly follows to an imported type's own symbol without also
   * picking up an unrelated wrapper utility type's docs.
   */
  docSymbol: ts.Symbol | undefined;
}

/**
 * Finds the props type for a component in a source file, resolving it
 * via the checker rather than by name-matching declarations in the same
 * file. This matters because in a typical real codebase the props type
 * is declared in a sibling `types.ts` and imported — using the checker
 * to resolve whatever type node the component's signature actually
 * points at follows that import for free, the same way it follows an
 * `extends` base interface across files. Checked several ways, since
 * "the props type" shows up in different places depending on how the
 * component is written:
 *  - a parameter's own type annotation, `(props: XProps) => ...` or
 *    `({ a, b }: XProps) => ...` (destructured — the annotation is on
 *    the parameter, not affected by the binding pattern)
 *  - the variable's own type annotation, `const X: React.FC<XProps> = ({ a }) => ...`
 *  - any call expression with type arguments assigned to a variable —
 *    `forwardRef<Ref, XProps>((props, ref) => ...)`,
 *    `SomeWrapper<XProps>(Component, ...)`, `memo<XProps>(...)`, etc.
 *    Generalized rather than hardcoded to forwardRef/memo by name, since
 *    real component libraries wrap components in their own HOCs using
 *    the same shape (a type argument that *is* the props type).
 *  - a `memo(...)`/any other wrapper with no type arguments of its own —
 *    handled for free by walking the whole tree rather than only the
 *    top level of a function declaration or variable initializer, so
 *    the inner function/arrow expression's own parameter annotation is
 *    still found.
 *
 * Falls back to "first exported `Props`-or-`*Props`-named declaration
 * in this file" when no component signature can be resolved at all
 * (e.g. a bare type-only fixture with no component function).
 */
export function resolvePropsType(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker
): ResolvedPropsType | undefined {
  const fromSignature = findPropsTypeFromComponentSignature(sourceFile, checker);
  if (fromSignature) return fromSignature;

  let fallback: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (fallback) return;
    if (ts.isInterfaceDeclaration(node) && isPropsName(node.name.text)) fallback = node;
    if (ts.isTypeAliasDeclaration(node) && isPropsName(node.name.text)) fallback = node;
  });
  if (!fallback) return undefined;

  return {
    type: checker.getTypeAtLocation(fallback),
    contextNode: fallback,
    displayName: fallback.name.text,
    docSymbol: checker.getSymbolAtLocation(fallback.name),
  };
}

function findPropsTypeFromComponentSignature(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker
): ResolvedPropsType | undefined {
  let found: ResolvedPropsType | undefined;

  const resolveFromTypeNode = (typeNode: ts.TypeNode, contextNode: ts.Node) => {
    if (found) return;
    const type = checker.getTypeFromTypeNode(typeNode);
    // Not a plausible props type (e.g. a primitive parameter on some
    // unrelated helper function encountered while walking the tree) —
    // skip rather than confidently claim it.
    if (!(type.getFlags() & ts.TypeFlags.Object) && !type.isUnion() && !type.isIntersection()) {
      return;
    }
    // Resolve documentation from the identifier actually written at
    // this reference site (e.g. "XProps" in `props: XProps`), not from
    // the resolved type's own symbol — see ResolvedPropsType.docSymbol.
    const docSymbol = ts.isTypeReferenceNode(typeNode)
      ? checker.getSymbolAtLocation(
          ts.isQualifiedName(typeNode.typeName) ? typeNode.typeName.right : typeNode.typeName
        )
      : (type.aliasSymbol ?? type.symbol);

    found = { type, contextNode, displayName: typeDisplayName(typeNode, type, checker), docSymbol };
  };

  const checkParams = (params: ts.NodeArray<ts.ParameterDeclaration>) => {
    if (found || params.length === 0) return;
    const paramType = params[0].type;
    if (paramType) resolveFromTypeNode(paramType, params[0]);
  };

  // `const X: React.FC<XProps> = (...) => ...` — the props type is a
  // type argument on the *variable's* annotation, not the parameter.
  //
  // Requires the variable to be exported: without the old React.FC-
  // name-only filter, matching *any* generic type reference here would
  // false-positive on unrelated code (`const cache: Map<string, X> = ...`).
  // An unexported local isn't a plausible component to document anyway.
  const checkVariableTypeAnnotation = (decl: ts.VariableDeclaration) => {
    if (found || !decl.type || !ts.isTypeReferenceNode(decl.type) || !isExported(decl)) return;
    const propsArg = decl.type.typeArguments?.[0];
    if (propsArg) resolveFromTypeNode(propsArg, decl);
  };

  // Any `SomeWrapper<..., XProps, ...>(...)` call assigned to a
  // variable — forwardRef, memo, or a project's own HOC. Not hardcoded
  // to a specific wrapper name: tries each type argument in order and
  // takes the first that resolves to a plausible object/union/
  // intersection type, since which position holds the props type
  // varies by wrapper (forwardRef's is typically the 2nd, a simple
  // custom wrapper's is often the 1st). Same export requirement as
  // above, for the same reason (avoid matching e.g. a local
  // `useMemo<Y>(...)` call).
  const checkWrapperCall = (decl: ts.VariableDeclaration) => {
    if (found || !decl.initializer || !ts.isCallExpression(decl.initializer) || !isExported(decl)) {
      return;
    }
    const typeArgs = decl.initializer.typeArguments;
    if (!typeArgs || typeArgs.length === 0) return;

    // Prefer a type argument whose own name looks like a props type
    // (the near-universal `*Props` convention) over just taking the
    // first object-like one — forwardRef<HTMLButtonElement, XProps>
    // would otherwise match the ref type first, since it's an object
    // type too.
    const byName = typeArgs.find(
      (arg) => ts.isTypeReferenceNode(arg) && /Props$/.test(rightmostName(arg.typeName))
    );
    if (byName) {
      resolveFromTypeNode(byName, decl);
      if (found) return;
    }

    for (const typeArg of typeArgs) {
      resolveFromTypeNode(typeArg, decl);
      if (found) return;
    }
  };

  const visit = (node: ts.Node) => {
    if (found) return;

    if (ts.isFunctionDeclaration(node)) {
      checkParams(node.parameters);
    }
    // Checked regardless of where this function/arrow expression sits
    // in the tree (top-level initializer, wrapped in memo(...), the
    // second argument to forwardRef(...), etc.) — forEachChild below
    // reaches it either way, so no wrapper needs special-casing here.
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      checkParams(node.parameters);
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        checkVariableTypeAnnotation(decl);
        checkWrapperCall(decl);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
}

function typeDisplayName(typeNode: ts.TypeNode, type: ts.Type, checker: ts.TypeChecker): string {
  if (ts.isTypeReferenceNode(typeNode)) {
    return rightmostName(typeNode.typeName);
  }
  // A component's real parameter annotation is often an intersection
  // like `XProps & InternalProps & WrapperProps` — internal/wrapper
  // additions mixed in alongside the type a human actually thinks of
  // as "the props type". Prefer the first `*Props`-named constituent
  // over the full (long, implementation-detail-laden) intersection
  // string as the display name; the full prop set from every
  // constituent is still returned regardless, this only affects the
  // one-line name shown for the component.
  if (ts.isIntersectionTypeNode(typeNode)) {
    const namedProps = typeNode.types.find(
      (t) => ts.isTypeReferenceNode(t) && /Props$/.test(rightmostName(t.typeName))
    );
    if (namedProps && ts.isTypeReferenceNode(namedProps)) {
      return rightmostName(namedProps.typeName);
    }
  }
  // Union/inline object literal/anything else — no single clean
  // reference name on the node itself; fall back to whatever symbol
  // the checker resolved, or the stringified type as a last resort.
  return type.symbol?.name ?? type.aliasSymbol?.name ?? checker.typeToString(type);
}

function isExported(decl: ts.VariableDeclaration): boolean {
  const statement = decl.parent.parent;
  return !!(ts.getCombinedModifierFlags(statement as unknown as ts.Declaration) & ts.ModifierFlags.Export);
}

function rightmostName(name: ts.EntityName): string {
  return ts.isQualifiedName(name) ? name.right.text : name.text;
}

function isPropsName(name: string): boolean {
  return name === 'Props' || name.endsWith('Props');
}
