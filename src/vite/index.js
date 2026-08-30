import { parse } from 'react-docgen-pro';

export { argTypesForVariant } from './argTypes.js';

/**
 * Minimal Vite plugin: for each .tsx file, runs it through react-docgen-pro's
 * parse() and appends `ComponentName.__docgenInfo = {...}` to the
 * transformed module — the same static-property convention Storybook's
 * addon-docs / ArgsTable already reads from
 * @joshwooding/vite-plugin-react-docgen-typescript, so no Storybook-side
 * changes are needed to see the result.
 *
 * Dummy-sandbox scope: finds component names via a simple regex
 * (`export function X` / `export const X =` / `export { X as Y }`)
 * rather than a real AST walk — good enough to prove the wiring end to
 * end, but see findComponentNames' own comment for a real limitation
 * this has on files with multiple differently-scoped exports.
 *
 * @param {import('react-docgen-pro').ParseOptions} [options] Forwarded
 * as-is to every `parse()` call — e.g. `viteLoader({ maxTypeNameLength: 80 })`.
 */
export function viteLoader(options) {
  return {
    name: 'rdrp-docgen',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.tsx') || id.includes('node_modules') || id.includes('.stories.')) {
        return null;
      }

      // Only inject when we found real exported component identifiers
      // in the source. Never fall back to documentation.displayName as
      // an injection target — parse() will happily resolve a "props
      // type" for a hook or utility function too (anything with an
      // object-shaped parameter), and its displayName in that case can
      // be an arbitrary type string like "Partial<ConfigProps> |
      // undefined" — not a valid JS identifier. Splicing that into
      // generated code produces a syntax error that breaks the whole
      // build, not just a skipped file, so this check is load-bearing,
      // not an optimization.
      const componentNames = findComponentNames(code);
      if (componentNames.length === 0) return null;

      let documentation;
      try {
        documentation = parse(id, options);
      } catch {
        // No Props type in this file (e.g. not a component file) — skip silently.
        return null;
      }

      // Attaches to *every* plausible exported binding, not just one —
      // a file commonly exports several differently-scoped versions of
      // "the" component (an internal base, a public wrapper, a
      // Storybook-specific unwrapped alias via `export { X as Y }`),
      // and this module has no reliable way to know which one a given
      // consumer will actually import. Missing the right one means
      // Storybook shows names/types with zero descriptions (the props
      // come from wherever *is* documented, but the rendered component
      // itself carries no __docgenInfo at all) — worse than attaching
      // the same (single, best-guess) props to every candidate.
      // Known imprecision: every export gets identical props even
      // when their real prop types differ (e.g. an internal-only
      // export vs. its public-facing wrapper) — a real per-export fix
      // needs core to resolve props per named export, not just once
      // per file.
      const injections = componentNames
        .map((name) => {
          const docgenInfo = { ...documentation, displayName: name };
          return `try { ${name}.__docgenInfo = ${JSON.stringify(docgenInfo)}; } catch (e) {}`;
        })
        .join('\n');

      return { code: `${code}\n${injections}\n`, map: null };
    },
  };
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
