import ts from 'typescript';

export function getSymbolDescription(symbol: ts.Symbol, checker: ts.TypeChecker): string | undefined {
  const parts = symbol.getDocumentationComment(checker);
  const text = ts.displayPartsToString(parts).trim();
  return text.length > 0 ? text : undefined;
}

/** Reads an `@default <value>` jsdoc tag off a symbol, e.g. `@default 3` -> "3". */
export function getDefaultValueTag(symbol: ts.Symbol, checker: ts.TypeChecker): string | undefined {
  const tag = symbol.getJsDocTags(checker).find((t) => t.name === 'default');
  if (!tag) return undefined;
  const text = tag.text ? ts.displayPartsToString(tag.text).trim() : '';
  return text.length > 0 ? text : undefined;
}
