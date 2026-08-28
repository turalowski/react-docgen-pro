# react-docgen-pro

A TypeScript-aware props parser for React components, built on the TypeScript
compiler API. Unlike `react-docgen-typescript`, it doesn't stop at stringifying
a union type — it expands discriminated unions, unions of objects, and nested
object props into structured data, so tooling like Storybook can render them
properly instead of showing an opaque type string.

```bash
npm install --save-dev react-docgen-pro
```

## Quick start

Most people use this through the Vite or webpack integration below to get
Storybook's Controls panel working properly — jump to whichever builder you
use. If you just want the parsed props as JSON, call `parse()` directly:

```ts
import { parse } from 'react-docgen-pro';

const doc = parse('./src/Button.tsx');
```

`doc` looks like:

```json
{
  "displayName": "Button",
  "description": "A clickable button.",
  "props": {
    "label": { "name": "label", "required": true, "type": { "name": "string" }, "description": "Text shown on the button." },
    "variant": { "name": "variant", "required": false, "type": { "name": "\"primary\" | \"secondary\"" }, "defaultValue": { "value": "\"primary\"" } }
  }
}
```

For a component whose `Props` type is a union of object shapes (a
discriminated union), `doc.elements` additionally carries the full per-branch
breakdown — every field from every branch, not just the flattened
intersection — which is what the Storybook integration below uses to drive
Controls.

## Using it with Storybook + Vite

```bash
npm install --save-dev react-docgen-pro
```

In `.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';
import { viteLoader } from 'react-docgen-pro/vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  addons: [
    '@storybook/addon-essentials',
    // Registers a Storybook argTypesEnhancer that hides Controls fields
    // from non-active union branches and fills in branch-specific
    // descriptions — runs automatically for every story.
    'react-docgen-pro/vite/preset',
  ],
  typescript: {
    // Turn off Storybook's built-in docgen — react-docgen-pro supplies
    // __docgenInfo itself via the plugin below.
    reactDocgen: false,
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(viteLoader());
    return viteConfig;
  },
};

export default config;
```

## Using it with Storybook + webpack

```bash
npm install --save-dev react-docgen-pro
```

In `.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  framework: '@storybook/react-webpack5',
  addons: [
    '@storybook/addon-essentials',
    // Same preset used by the Vite setup — it's builder-agnostic.
    'react-docgen-pro/vite/preset',
  ],
  typescript: {
    reactDocgen: false,
  },
  webpackFinal: async (webpackConfig) => {
    webpackConfig.module ??= { rules: [] };
    webpackConfig.module.rules ??= [];
    webpackConfig.module.rules.push({
      test: /\.tsx$/,
      exclude: /node_modules/,
      enforce: 'pre',
      use: [{ loader: 'react-docgen-pro/webpack' }],
    });
    return webpackConfig;
  },
};

export default config;
```

Either way, once wired in, every exported component in a `.tsx` file gets a
`Component.__docgenInfo` static property attached at build time — the same
convention `react-docgen-typescript`-based tooling already reads — so
Storybook's addon-docs and Controls panel pick it up with no other changes.

### What you get in Controls that plain react-docgen-typescript doesn't give you

For a `Props` type that's a discriminated union (e.g. a `Button` whose props
differ by `variant: 'link' | 'icon'`), plain react-docgen-typescript only
shows the fields common to every variant. With the preset registered:

- Controls hides fields that belong to a different branch than the one the
  current story's args select
- each visible field keeps its branch-specific jsdoc description
- a prop typed as a nested interface or a union of object shapes shows its
  real field-by-field shape in the Type column's detail popover, instead of
  just the bare type name

## Roadmap: supported prop shapes

From simplest to most complex. Each fixture in [test/fixtures](test/fixtures)
is a real example of the row it's next to.

### Fully supported

- Plain interfaces/type aliases — required vs. optional props, jsdoc
  descriptions (component-level and per-prop), `@default` tags
- `extends`, including multi-level chains, and across files (importing a
  base interface from another module)
- Intersections (`A & B`) — merges props from every constituent, including
  one that itself resolves via a cross-file `extends`; picks a clean
  display name (the `*Props`-named constituent) instead of the full
  intersection string
- Unions of primitives (`'a' | 'b' | 'c'`)
- Unions of objects, both as a single prop's type and as the whole `Props`
  type — split into branches with each branch's own props and jsdoc, plus a
  detected discriminant when one exists
- Type helpers: `Pick`, `Omit`, `Partial`, `Required`, `Record`
- Nested object props (a prop typed as another named interface), expanded up
  to 2 levels deep, with a cycle guard for self-referential types
- Components written as a function declaration, `React.FC`, `forwardRef`, or
  wrapped in `memo` — plus destructured-props signatures and arbitrary
  project-specific HOC wrappers, so long as the props type appears as a type
  argument or parameter annotation somewhere in the wrapper call
  (`SomeWrapper<XProps>(Component, ...)`)
- Multi-project setups via `tsconfig.json` path resolution

### Partially supported

- Nested object props deeper than 2 levels — stops expanding past the
  2-level limit and falls back to the bare type name, rather than erroring
- Non-discriminated unions of objects — branches are still split out, but
  without a detected discriminant field to drive Storybook Controls
  automatically

### Not yet supported

- Generic components (`function List<T>(props: ListProps<T>)`) — the type
  parameter isn't resolved against a concrete type, so the emitted shape is
  imprecise
- Mapped types (`{ [K in Keys]: ... }`) beyond the built-in `Partial`/
  `Required`/`Record`/`Pick`/`Omit` helpers
- Function-typed props (event handlers, render props) are recorded by their
  signature string only — no structured breakdown of parameter/return types
- Enums (`enum Variant { ... }`) as a prop's type — resolved to their
  underlying primitive rather than the individual member names

## Contributing / local development

See [examples/](examples/) for runnable Storybook sandboxes (Vite and
webpack builders) and [RELEASING.md](RELEASING.md) for how the package is
versioned and published. `npm test` runs the parser's fixture-based
snapshot suite.
