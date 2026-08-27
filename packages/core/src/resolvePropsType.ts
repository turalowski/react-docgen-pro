import ts from 'typescript';

/**
 * Finds the props type node for a component in a source file.
 *
 * Preferred strategy: find a function component and resolve its props
 * type back to a declaration in this file, checked several ways since
 * "the props type" can show up in different places depending on how
 * the component is written:
 *  - a parameter's own type annotation, `(props: XProps) => ...` or
 *    `({ a, b }: XProps) => ...` (destructured — the annotation is on
 *    the parameter, not affected by the binding pattern)
 *  - the variable's own type annotation, `const X: React.FC<XProps> = ({ a }) => ...`
 *  - a `forwardRef<Ref, XProps>((props, ref) => ...)` call's second
 *    type argument
 *  - a `memo(...)` (or any other) wrapper — handled for free, since
 *    the inner function/arrow expression is found by walking the
 *    whole tree rather than only looking at the top level of a
 *    function declaration or variable initializer
 *
 * This is what correctly picks `XProps` over a same-file helper
 * interface like `IconProps` that merely also matches the naming
 * convention but isn't what any component actually takes as props.
 *
 * Falls back to "first exported `Props`-or-`*Props`-named declaration"
 * when no component signature can be resolved (e.g. a bare type-only
 * fixture with no component function), so existing simple fixtures
 * keep working.
 */
export function resolvePropsType(
  sourceFile: ts.SourceFile
): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined {
  const candidatesByName = new Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>();

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node) && isPropsName(node.name.text)) {
      candidatesByName.set(node.name.text, node);
    }
    if (ts.isTypeAliasDeclaration(node) && isPropsName(node.name.text)) {
      candidatesByName.set(node.name.text, node);
    }
  });

  const fromComponentSignature = findPropsTypeFromComponentSignature(sourceFile, candidatesByName);
  if (fromComponentSignature) return fromComponentSignature;

  // Fallback: first candidate in declaration order.
  return candidatesByName.values().next().value;
}

const COMPONENT_TYPE_ALIASES = new Set(['FC', 'FunctionComponent', 'VFC']);

function findPropsTypeFromComponentSignature(
  sourceFile: ts.SourceFile,
  candidatesByName: Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>
): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined {
  let found: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined;

  const resolveByName = (name: string) => {
    if (found) return;
    const candidate = candidatesByName.get(name);
    if (candidate) found = candidate;
  };

  const checkParams = (params: ts.NodeArray<ts.ParameterDeclaration>) => {
    if (found || params.length === 0) return;
    const paramType = params[0].type;
    if (paramType && ts.isTypeReferenceNode(paramType) && ts.isIdentifier(paramType.typeName)) {
      resolveByName(paramType.typeName.text);
    }
  };

  // `const X: React.FC<XProps> = (...) => ...` — the props type is a
  // type argument on the *variable's* annotation, not the parameter.
  const checkVariableTypeAnnotation = (decl: ts.VariableDeclaration) => {
    if (found || !decl.type || !ts.isTypeReferenceNode(decl.type)) return;
    if (!COMPONENT_TYPE_ALIASES.has(rightmostName(decl.type.typeName))) return;
    const propsArg = decl.type.typeArguments?.[0];
    if (propsArg && ts.isTypeReferenceNode(propsArg) && ts.isIdentifier(propsArg.typeName)) {
      resolveByName(propsArg.typeName.text);
    }
  };

  // `forwardRef<Ref, XProps>((props, ref) => ...)` — the props type is
  // the call's second type argument, not on the inner function at all.
  const checkForwardRefCall = (decl: ts.VariableDeclaration) => {
    if (found || !decl.initializer || !ts.isCallExpression(decl.initializer)) return;
    const call = decl.initializer;
    if (calleeName(call.expression) !== 'forwardRef') return;
    const propsArg = call.typeArguments?.[1];
    if (propsArg && ts.isTypeReferenceNode(propsArg) && ts.isIdentifier(propsArg.typeName)) {
      resolveByName(propsArg.typeName.text);
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
        checkForwardRefCall(decl);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
}

function rightmostName(name: ts.EntityName): string {
  return ts.isQualifiedName(name) ? name.right.text : name.text;
}

function calleeName(expr: ts.Expression): string | undefined {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return undefined;
}

function isPropsName(name: string): boolean {
  return name === 'Props' || name.endsWith('Props');
}
