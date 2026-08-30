import { parse } from 'react-docgen-pro';

/**
 * Webpack loader equivalent of the vite loader (src/vite/index.js): same
 * job (parse the file via react-docgen-pro, inject __docgenInfo onto the
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
 * findComponentNames below is intentionally duplicated from
 * src/vite/index.js rather than shared — same small regex-based
 * heuristic, kept next to each builder integration so neither depends
 * on the other's internals.
 *
 * Loader options (e.g. `{ maxTypeNameLength: 80 }`) are set on the
 * rule itself — `use: [{ loader: 'react-docgen-pro/webpack', options: {...} }]`
 * — and read here via the standard webpack 5 `this.getOptions()`, then
 * forwarded as-is to `parse()`. No schema validation: this loader
 * takes exactly react-docgen-pro's own `ParseOptions` shape, so a
 * typo here just surfaces the same way a bad `parse()` call would.
 */
export default function webpackLoader(source) {
  const filePath = this.resourcePath;
  const options = this.getOptions?.();

  if (!filePath.endsWith('.tsx') || filePath.includes('node_modules') || filePath.includes('.stories.')) {
    return source;
  }

  // Only inject when we found real exported component identifiers in
  // the source. Never fall back to documentation.displayName as an
  // injection target — parse() will happily resolve a "props type"
  // for a hook or utility function too (anything with an object-
  // shaped parameter), and its displayName in that case can be an
  // arbitrary type string like "Partial<ConfigProps> | undefined" —
  // not a valid JS identifier. Splicing that into generated code
  // produces a syntax error that breaks the whole build, not just a
  // skipped file, so this check is load-bearing, not an optimization.
  const componentNames = findComponentNames(source);
  if (componentNames.length === 0) return source;

  let documentation;
  try {
    documentation = parse(filePath, options);
  } catch {
    // No Props type in this file (e.g. not a component file) — skip silently.
    return source;
  }

  // Attaches to *every* plausible exported binding, not just one — a
  // file commonly exports several differently-scoped versions of "the"
  // component (an internal base, a public wrapper, a Storybook-
  // specific unwrapped alias via `export { X as Y }`), and this module
  // has no reliable way to know which one a given consumer will
  // actually import. Missing the right one means Storybook shows
  // names/types with zero descriptions (the props come from wherever
  // *is* documented, but the rendered component itself carries no
  // __docgenInfo at all) — worse than attaching the same (single,
  // best-guess) props to every candidate.
  // Known imprecision: every export gets identical props even when
  // their real prop types differ (e.g. an internal-only export vs. its
  // public-facing wrapper) — a real per-export fix needs core to
  // resolve props per named export, not just once per file.
  const injections = componentNames
    .map((name) => {
      const docgenInfo = { ...documentation, displayName: name };
      return `try { ${name}.__docgenInfo = ${JSON.stringify(docgenInfo)}; } catch (e) {}`;
    })
    .join('\n');

  return `${source}\n${injections}\n`;
}

function findComponentNames(code) {
  const names = new Set();

  for (const m of code.matchAll(/export function ([A-Z][A-Za-z0-9]*)\s*\(/g)) {
    names.add(m[1]);
  }
  for (const m of code.matchAll(/export const ([A-Z][A-Za-z0-9]*)\s*[:=]/g)) {
    names.add(m[1]);
  }
  // `export { X, Z as W }` — a plain re-export list. The *local* name
  // (before `as`, if present) is what needs __docgenInfo attached,
  // since that's the actual declared binding in this module's scope;
  // whatever alias another file imports it as doesn't change the
  // object identity.
  for (const m of code.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const part of m[1].split(',')) {
      const localName = part.trim().split(/\s+as\s+/)[0].trim();
      if (/^[A-Z][A-Za-z0-9]*$/.test(localName)) names.add(localName);
    }
  }

  return [...names];
}
