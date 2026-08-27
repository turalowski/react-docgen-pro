/**
 * Given a component's __docgenInfo (as produced by react-docgen-pro + our
 * vite plugin) and the discriminant value a particular story uses
 * (e.g. 'text'), returns a Storybook `argTypes` override that hides
 * every field belonging to *other* branches.
 *
 * Storybook's Controls panel merges `meta.argTypes` (built from the
 * full, unioned `docgenInfo.props`) with each story's own `argTypes`.
 * A field can be hidden per-story via `table: { disable: true }` —
 * this computes exactly that set from `elements`, so a "Text" story
 * only shows text-branch fields and a "CheckboxGroup" story only
 * shows checkbox-group fields, without hand-listing them per story.
 */
export function argTypesForVariant(docgenInfo, discriminantValue) {
  const elements = docgenInfo?.elements;
  if (!elements) return {};

  const wanted = JSON.stringify(discriminantValue);
  const branch = elements.find((e) => e.discriminant?.value === wanted);
  if (!branch) return {};

  const allowedNames = new Set(Object.keys(branch.props));
  const overrides = {};

  for (const name of Object.keys(docgenInfo.props)) {
    if (!allowedNames.has(name)) {
      overrides[name] = { table: { disable: true } };
    }
  }

  return overrides;
}
