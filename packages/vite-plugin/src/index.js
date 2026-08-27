import { parse } from '@rdrp/core';

export { argTypesForVariant } from './argTypes.js';

/**
 * Minimal Vite plugin: for each .tsx file, runs it through @rdrp/core's
 * parse() and appends `ComponentName.__docgenInfo = {...}` to the
 * transformed module — the same static-property convention Storybook's
 * addon-docs / ArgsTable already reads from
 * @joshwooding/vite-plugin-react-docgen-typescript, so no Storybook-side
 * changes are needed to see the result.
 *
 * Dummy-sandbox scope: finds the component name via a simple regex
 * (`export function X` / `export const X =`) rather than a real AST
 * walk — good enough to prove the wiring end to end. A production
 * version of this plugin would resolve the component name the same
 * way core's resolvePropsType resolves the props type, off the same
 * AST pass.
 */
export function rdrpDocgenPlugin() {
  return {
    name: 'rdrp-docgen',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.tsx') || id.includes('node_modules') || id.includes('.stories.')) {
        return null;
      }

      let documentation;
      try {
        documentation = parse(id);
      } catch {
        // No Props type in this file (e.g. not a component file) — skip silently.
        return null;
      }

      const componentName = findComponentName(code) ?? documentation.displayName;
      const docgenInfo = { ...documentation, displayName: componentName };

      const injected = `${code}\ntry { ${componentName}.__docgenInfo = ${JSON.stringify(docgenInfo)}; } catch (e) {}\n`;

      return { code: injected, map: null };
    },
  };
}

function findComponentName(code) {
  const fn = code.match(/export function ([A-Z][A-Za-z0-9]*)\s*\(/);
  if (fn) return fn[1];
  const arrow = code.match(/export const ([A-Z][A-Za-z0-9]*)\s*[:=]/);
  if (arrow) return arrow[1];
  return undefined;
}
