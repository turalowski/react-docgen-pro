import ts from 'typescript';

/**
 * Finds the props type node for a component in a source file.
 *
 * Preferred strategy: find a function component (function declaration
 * or `const X = (props) => ...`) and resolve its single parameter's
 * type reference back to a declaration in this file. This is what
 * correctly picks `InputProps` over a same-file helper interface
 * like `InputTextProps` that merely also matches the naming
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

function findPropsTypeFromComponentSignature(
  sourceFile: ts.SourceFile,
  candidatesByName: Map<string, ts.InterfaceDeclaration | ts.TypeAliasDeclaration>
): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined {
  let found: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined;

  const checkParams = (params: ts.NodeArray<ts.ParameterDeclaration>) => {
    if (found || params.length === 0) return;
    const paramType = params[0].type;
    if (paramType && ts.isTypeReferenceNode(paramType) && ts.isIdentifier(paramType.typeName)) {
      const candidate = candidatesByName.get(paramType.typeName.text);
      if (candidate) found = candidate;
    }
  };

  const visit = (node: ts.Node) => {
    if (found) return;

    if (ts.isFunctionDeclaration(node)) {
      checkParams(node.parameters);
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
        ) {
          checkParams(decl.initializer.parameters);
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
}

function isPropsName(name: string): boolean {
  return name === 'Props' || name.endsWith('Props');
}
