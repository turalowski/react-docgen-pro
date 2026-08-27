/**
 * Storybook argTypesEnhancer + preview annotation in one file: this
 * whole module gets bundled into the preview iframe (registered via
 * previewAnnotations in preset.js), so `argTypesEnhancers` needs to be
 * exported at the top level exactly like it would be from a project's
 * own .storybook/preview.ts.
 *
 * Runs automatically for every story — no per-story wiring needed.
 * Reads the rendering component's own __docgenInfo (attached by our
 * vite plugin) and the story's args to figure out which union branch
 * is active, then:
 *  - hides every field that belongs to a different branch
 *  - restores each visible field's branch-specific jsdoc description.
 *    core's merged top-level `props` deliberately drops a field's
 *    description when branches disagree on it (e.g. the discriminant
 *    field itself, like `type`, usually has a different doc comment
 *    per branch) rather than show the wrong text. Once we know which
 *    branch is actually active, there's no ambiguity left, so we can
 *    fill the correct one back in here.
 */
function rdrpArgTypesEnhancer(context) {
  const docgenInfo = context.component?.__docgenInfo;
  const elements = docgenInfo?.elements;
  if (!elements || elements.length === 0) return context.argTypes;

  const discriminantName = elements.find((e) => e.discriminant)?.discriminant?.name;
  if (!discriminantName) return context.argTypes;

  const currentValue = context.args?.[discriminantName] ?? context.initialArgs?.[discriminantName];
  if (currentValue === undefined) return context.argTypes;

  const branch = elements.find((e) => e.discriminant?.value === JSON.stringify(currentValue));
  if (!branch) return context.argTypes;

  const allowedNames = new Set(Object.keys(branch.props));
  const argTypes = { ...context.argTypes };

  for (const name of Object.keys(argTypes)) {
    if (!allowedNames.has(name)) {
      argTypes[name] = { ...argTypes[name], table: { ...argTypes[name]?.table, disable: true } };
      continue;
    }

    const branchDescription = branch.props[name]?.description;
    if (branchDescription && !argTypes[name]?.description) {
      argTypes[name] = { ...argTypes[name], description: branchDescription };
    }
  }

  return argTypes;
}

/**
 * For a prop whose type resolved to a nested object shape (core's
 * `type.properties`, e.g. `user: AvatarUser`) or a union of object
 * shapes (`type.elements`, e.g. `action: LinkAction | ButtonAction`),
 * Storybook's default Controls table would otherwise just show the
 * bare reference name(s) as the Type column with no way to see the
 * actual fields.
 *
 * Storybook's Type column supports a summary/detail pair —
 * `table.type.summary` is the visible, clickable text; `table.type.
 * detail` opens in a popover on click. This keeps summary as the
 * original type name(s) (e.g. "AvatarUser", or "LinkAction |
 * ButtonAction") — clickable, recognizable — and puts the full
 * expanded shape in detail, rendered recursively so an
 * interface-inside-an-interface (core expands up to 2 levels) shows
 * its own nested shape too, not just the outer one.
 */
function rdrpNestedShapeEnhancer(context) {
  const props = context.component?.__docgenInfo?.props;
  if (!props) return context.argTypes;

  const argTypes = { ...context.argTypes };

  for (const [name, prop] of Object.entries(props)) {
    if (!argTypes[name]) continue;

    const detail = prop.type?.properties
      ? renderShape(prop.type.properties)
      : prop.type?.elements
        ? prop.type.elements.map((branch) => renderShape(branch.props)).join(' | ')
        : undefined;
    if (!detail) continue;

    argTypes[name] = {
      ...argTypes[name],
      table: {
        ...argTypes[name].table,
        type: { summary: prop.type.name, detail },
      },
    };
  }

  return argTypes;
}

/** Recursively renders a props map as a pretty-printed object shape, expanding nested properties/elements at any depth core resolved. */
function renderShape(properties, indent = 0) {
  const pad = '  '.repeat(indent + 1);
  const closePad = '  '.repeat(indent);

  const fields = Object.values(properties).map((p) => {
    const valueType = p.type?.properties
      ? renderShape(p.type.properties, indent + 1)
      : p.type?.elements
        ? p.type.elements.map((branch) => renderShape(branch.props, indent + 1)).join(' | ')
        : p.type?.name ?? 'unknown';

    return `${pad}${p.name}${p.required ? '' : '?'}: ${valueType}`;
  });

  return `{\n${fields.join(';\n')};\n${closePad}}`;
}

export const argTypesEnhancers = [rdrpArgTypesEnhancer, rdrpNestedShapeEnhancer];
