# react-docgen-pro

It's a typescript-aware props parfer for React projects, built on the Typescript compiler API. 

## Motivation

Storybook works fine with React and Typescript, but once the types get complex, ArgTable can't parse them fully. A few issues I ran into were:

- jsdoc for props not showing up in Storybook at all
- some types described as a union instead of the interface name
- an interface name shown, but no way to see the actual structure of the type
- with union types, jsdocs disappearing entirely (the value itself comes through, but if a prop is optional, consumers have no way of seeing that)

It becomes a bigger issue when consumers need to see the props and end up having to open a code editor and go find the type definition in the library themselves.

While digging into this, I realized Storybook actually uses two different parsers under the hood — `react-docgen` and `react-docgen-typescript`.

They work fine up to a point, but often you hit a wall, need to start overriding argTypes by hand, and end up with two sources of truth (the type files and Storybook itself).

To fix this, I decided to use Claude Code and try writing my own parser to see if it could be solved properly.

That's how this journey started.

## Quick start

Most people use this through the Vite or webpack integration below to get
Storybook's Controls panel working properly — jump to whichever builder you
use. If you just want the parsed props as JSON, call `parse()` directly:

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
    // Pass options to viteLoader() to configure parsing, e.g. raise
    // (or Infinity to disable) the 50-char default cap on rendered
    // type-name strings like `Pick<Foo, "a" | "b" | ...>`.
    viteConfig.plugins.push(viteLoader({ maxTypeNameLength: 80 }));
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
      // `options` here is react-docgen-pro's own ParseOptions, forwarded
      // to every parse() call — same fields as the Vite loader above.
      use: [{ loader: 'react-docgen-pro/webpack', options: { maxTypeNameLength: 80 } }],
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

## Configuration

Both `viteLoader(options)` and the webpack loader's rule `options` take the
same `ParseOptions` object accepted by `parse()` directly:

| Option              | Default | What it does                                                                                     |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `maxTypeNameLength`  | `50`    | Caps a rendered type-name string (a prop's type, a union branch, a fallback displayName) at N characters, truncating with `…`. Set to `Infinity` to disable. |
| `maxDepth`           | `2`     | How many levels of nested object props get expanded into `type.properties`.                         |

```ts
import { parse } from 'react-docgen-pro';

const doc = parse('./Button.tsx', { maxTypeNameLength: 80 });
```

## Roadmap: supported prop shapes

From simplest to most complex. Each fixture in [test/fixtures](test/fixtures)
is a real example of the row it's next to.

- [ ] Plain interfaces with required and optional properties (also `default` tag) 
- [ ] Plain interfaces with nested interfaces
- [ ] Plain interfaces where props using named interfaces
- [ ] Union interfaces (`'A' | 'B' | 'C'`)
- [ ] Intersections  (`A & B`) and `extends` keyword
- [ ] Unions of primitives (`'a' | 'b' | 'c'`)
- [ ] Utility types - `Pick`, `Omit`, `Partial`, `Required`
- [ ] Components written as a function declaration, `React.FC`, `forwardRef` or wrapped in `memo` 
- [ ] Generic components (`function List<T>(props: ListProps<T>)`)
- Mapped types (`{ [K in Keys]: ... }`) beyond the built-in `Partial`/
  `Required`/`Record`/`Pick`/`Omit` helpers
- Function-typed props (event handlers, render props) are recorded by their
  signature string only — no structured breakdown of parameter/return types
- Enums (`enum Variant { ... }`) as a prop's type — resolved to their
  underlying primitive rather than the individual member names
