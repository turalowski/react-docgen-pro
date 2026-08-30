import ts from 'typescript';
import type { UnionBranch } from '../types.js';
// Circular import: extractProperties.ts imports resolveUnionBranches
// from this file. Safe in ESM since neither side calls the other at
// module-evaluation time — only inside function bodies, by which
// point both modules have finished initializing.
import { extractPropertiesFromType } from '../extractProperties.js';
import { DEFAULT_PARSE_OPTIONS, type ResolvedParseOptions } from '../options.js';
import { truncateTypeName } from '../utils/truncateTypeName.js';

/**
 * Detects a "union of objects" prop type (e.g.
 * `{ type: 'a'; foo: string } | { type: 'b'; bar: number }`) and, if
 * one is found, splits it into per-branch prop sets — this is the
 * actual differentiator vs. react-docgen-typescript, which only
 * stringifies the whole union and stops there.
 *
 * Returns undefined for anything that isn't a union of object types
 * (primitive unions like `'a' | 'b'`, single object types, etc.) —
 * in that case the caller just keeps the flattened `type.name` string.
 */
export function resolveUnionBranches(
  type: ts.Type,
  contextNode: ts.Node,
  checker: ts.TypeChecker,
  options: ResolvedParseOptions = DEFAULT_PARSE_OPTIONS
): UnionBranch[] | undefined {
  if (!type.isUnion()) return undefined;

  const branches = type.types;
  const isObjectUnion = branches.every(
    (t) => !t.isLiteral() && !!(t.getFlags() & ts.TypeFlags.Object)
  );
  if (!isObjectUnion) return undefined;

  const discriminantName = findDiscriminant(branches, checker);

  return branches.map((branchType) => {
    const branchProps = extractPropertiesFromType(branchType, contextNode, checker, 0, options);
    const discriminant = discriminantName
      ? {
          name: discriminantName,
          value: truncateTypeName(
            literalPropValue(branchType, discriminantName, checker),
            options.maxTypeNameLength
          ),
        }
      : undefined;

    return {
      ...(discriminant ? { discriminant } : {}),
      props: branchProps,
    };
  });
}

/**
 * A discriminant is a property present in every branch whose value is
 * a distinct literal (string/number/boolean) in each one — the common
 * `type: 'a'` / `type: 'b'` pattern. Picks the first property that
 * qualifies across all branches; returns undefined if none does.
 */
function findDiscriminant(branches: ts.Type[], checker: ts.TypeChecker): string | undefined {
  if (branches.length === 0) return undefined;

  const firstBranchProps = checker.getPropertiesOfType(branches[0]).map((s) => s.name);

  for (const propName of firstBranchProps) {
    const valuesAreAllLiteral = branches.every((branch) => {
      const symbol = checker.getPropertyOfType(branch, propName);
      if (!symbol) return false;
      const propType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration ?? branch.symbol.valueDeclaration!);
      return propType.isLiteral();
    });
    if (valuesAreAllLiteral) return propName;
  }

  return undefined;
}

function literalPropValue(branch: ts.Type, propName: string, checker: ts.TypeChecker): string {
  const symbol = checker.getPropertyOfType(branch, propName);
  if (!symbol) return '';
  const propType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration ?? branch.symbol.valueDeclaration!);
  return checker.typeToString(propType);
}
