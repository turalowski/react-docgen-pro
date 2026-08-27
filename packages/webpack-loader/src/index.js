import { parse } from '@rdrp/core';

/**
 * Webpack loader equivalent of vite-plugin's rdrpDocgenPlugin: same
 * job (parse the file via @rdrp/core, inject __docgenInfo onto the
 * component so Storybook's addon-docs/Controls can read it), but
 * wired in via webpackFinal's module.rules instead of a Vite
 * transform hook, since Storybook's webpack5 builder doesn't go
 * through Vite at all.
 *
 * `enforce: 'pre'` (set by the consumer's webpackFinal, see README)
 * runs this before the framework's own babel/ts transform, so it
 * receives raw .tsx source and can safely append plain JS at the end
 * — the appended assignment statement is valid syntax standing alone
 * in a TS/TSX file, so the next loader in the chain parses the whole
 * thing, injected line included, without needing to know about us.
 *
 * findComponentName below is intentionally duplicated from
 * vite-plugin/src/index.js rather than shared — same small
 * regex-based heuristic, kept in each loader's own package so neither
 * builder integration depends on the other.
 */
export default function rdrpWebpackLoader(source) {
  const filePath = this.resourcePath;

  if (!filePath.endsWith('.tsx') || filePath.includes('node_modules') || filePath.includes('.stories.')) {
    return source;
  }

  let documentation;
  try {
    documentation = parse(filePath);
  } catch {
    // No Props type in this file (e.g. not a component file) — skip silently.
    return source;
  }

  const componentName = findComponentName(source) ?? documentation.displayName;
  const docgenInfo = { ...documentation, displayName: componentName };

  return `${source}\ntry { ${componentName}.__docgenInfo = ${JSON.stringify(docgenInfo)}; } catch (e) {}\n`;
}

function findComponentName(code) {
  const fn = code.match(/export function ([A-Z][A-Za-z0-9]*)\s*\(/);
  if (fn) return fn[1];
  const arrow = code.match(/export const ([A-Z][A-Za-z0-9]*)\s*[:=]/);
  if (arrow) return arrow[1];
  return undefined;
}
