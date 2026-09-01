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
 * `type.properties`, e.g. `user: AvatarUser`, or `tags: Tag[]`) or a
 * union of object shapes (`type.elements`, e.g. `action: LinkAction |
 * ButtonAction`), Storybook's default Controls table would otherwise
 * just show the bare reference name(s) as the Type column with no way
 * to see the actual fields.
 *
 * Storybook's Type column supports a summary/detail pair —
 * `table.type.summary` is the visible, clickable text; `table.type.
 * detail` opens in a popover on click. This keeps summary as the
 * original type name(s) (e.g. "AvatarUser", "Tag[]", or "LinkAction |
 * ButtonAction") — clickable, recognizable — and puts the full
 * expanded shape in detail, rendered recursively so an
 * interface-inside-an-interface (core expands up to 2 levels) shows
 * its own nested shape too, not just the outer one.
 *
 * Also disables Storybook's default interactive "object" control for
 * every array-typed prop (`control: false`). react-docgen-typescript-
 * shaped type names it can't otherwise classify (any named reference,
 * including plain arrays like `Tag[]` or `string[]`) fall back to that
 * generic control, which edits the *runtime* value via react-inspector
 * — clicking its "show non-enumerable properties" toggle on an array
 * value walks Array.prototype, surfacing push/pop/map/... as if they
 * were editable fields. There's no safe/useful live-edit UI for an
 * array here anyway, so this table.type.detail popover (read-only,
 * static, no prototype involved) replaces it as the way to inspect the
 * shape instead.
 */
function rdrpNestedShapeEnhancer(context) {
  const props = context.component?.__docgenInfo?.props;
  if (!props) return context.argTypes;

  const argTypes = { ...context.argTypes };

  for (const [name, prop] of Object.entries(props)) {
    if (!argTypes[name]) continue;

    const isArray = isArrayTypeName(prop.type?.name);
    const detail = expandedShapeFor(prop);

    argTypes[name] = {
      ...argTypes[name],
      ...(isArray ? { control: false } : {}),
      ...(detail
        ? { table: { ...argTypes[name].table, type: { summary: prop.type.name, detail } } }
        : {}),
    };
  }

  return argTypes;
}

/** True for a TS-printed array type name — "Tag[]", "string[]", "readonly Tag[]" — covering every form checker.typeToString produces for an array type. */
function isArrayTypeName(name) {
  return typeof name === 'string' && /\[\]$/.test(name);
}

/**
 * Renders the expanded shape for one PropDescriptor — its `type.
 * properties` (wrapped in `Array<...>` when the prop's own type name is
 * an array, e.g. `tags: Tag[]` renders as `Array<{ ... }>`, not a bare
 * `{ ... }` that reads as if `tags` held a single Tag) or its `type.
 * elements` (each union branch's shape, joined with ` | `). Returns
 * undefined when there's no structure to expand, e.g. a plain
 * `string[]` — a regular array has nothing more useful to show than
 * its type name, which is already the clickable-free (non-object-
 * control) Type column text.
 */
function expandedShapeFor(prop, indent = 0) {
  if (prop.type?.properties) {
    const shape = renderShape(prop.type.properties, indent);
    return isArrayTypeName(prop.type.name) ? `Array<${shape}>` : shape;
  }
  if (prop.type?.elements) {
    return prop.type.elements.map((branch) => renderShape(branch.props, indent)).join(' | ');
  }
  if (prop.type?.parameters || prop.type?.returnType) {
    return renderFunctionSignature(prop.type.parameters, prop.type.returnType, indent);
  }
  return undefined;
}

/**
 * Renders a function-shaped prop's (core's `type.parameters`/`type.
 * returnType`) full call signature as `(param: Type, ...) => Return` —
 * each part's own type is expanded inline via `renderShape` when core
 * resolved it to a nested object shape (a user-defined interface, never
 * a built-in like `MouseEvent`), the same way a plain object prop's
 * nested fields are. A `void`/`undefined`/`any`/`unknown` return (core
 * omits `returnType` for those) falls back to the generic `...`, same
 * as before this had a real return type to show.
 */
function renderFunctionSignature(parameters, returnType, indent) {
  const params = (parameters ?? [])
    .map((p) => {
      const valueType = p.type?.properties ? renderShape(p.type.properties, indent) : p.type?.name ?? 'unknown';
      return `${p.name}${p.required ? '' : '?'}: ${valueType}`;
    })
    .join(', ');

  const returns = returnType?.properties ? renderShape(returnType.properties, indent) : returnType?.name ?? '...';

  return `(${params}) => ${returns}`;
}

/** Recursively renders a props map as a pretty-printed object shape, expanding nested properties/elements at any depth core resolved. */
function renderShape(properties, indent = 0) {
  const pad = '  '.repeat(indent + 1);
  const closePad = '  '.repeat(indent);

  const fields = Object.values(properties).map((p) => {
    const valueType = expandedShapeFor(p, indent + 1) ?? p.type?.name ?? 'unknown';
    return `${pad}${p.name}${p.required ? '' : '?'}: ${valueType}`;
  });

  return `{\n${fields.join(';\n')};\n${closePad}}`;
}

export const argTypesEnhancers = [rdrpArgTypesEnhancer, rdrpNestedShapeEnhancer];
