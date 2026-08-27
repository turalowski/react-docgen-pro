# react-docgen-rich-parser

A TypeScript-aware props parser for React components, built on the TypeScript
compiler API. Unlike `react-docgen-typescript`, it doesn't stop at stringifying
a union type — it expands discriminated unions, unions of objects, and nested
object props into structured data, so tooling like Storybook can render them
properly instead of showing an opaque type string.

## Project structure

This is an npm workspaces monorepo:

```
packages/
  core/           TS/TSX file in, Documentation JSON out. No Storybook
                   dependency — reusable anywhere.
  vite-plugin/    Vite plugin that attaches __docgenInfo to each component
                   (the same convention react-docgen-typescript uses), plus
                   a Storybook argTypesEnhancer preset that makes Controls
                   aware of the richer data core produces.
examples/
  storybook-sandbox/   A real Storybook app wired to the above via workspace
                        linking — the manual/visual testing playground.
```

## Setup

Requires Node 18+ (no `pnpm` needed — this uses plain npm workspaces).

```bash
npm install
```

This installs dependencies for every workspace package and symlinks
`@rdrp/core` / `@rdrp/vite-plugin` into `examples/storybook-sandbox` — any
change to `core` is live in the sandbox after a rebuild, no publishing.

## Running the parser's tests

```bash
npm test
```

Runs `packages/core`'s fixture-based snapshot suite (`packages/core/test/`).
Each fixture under `test/fixtures/*.tsx` is a minimal, focused `.tsx` file
exercising one parsing concern (basic interfaces, jsdoc, `extends`, unions,
utility types like `Pick`/`Omit`/`Partial`, nested object props, ...) —
`test/parse.test.ts` parses each one and snapshot-tests the result. When you
change parsing behavior, run the tests and review the snapshot diff; if the
new output is correct, update it with:

```bash
cd packages/core && npx vitest run -u
```

## Inspecting parser output directly

To see the actual JSON `parse()` produces for any file, without going
through Storybook:

```bash
cd packages/core
npm run build
node scripts/inspect.mjs test/fixtures/01-basic-interface.tsx
# or point it at any other .tsx file, e.g. one in the sandbox:
node scripts/inspect.mjs ../../examples/storybook-sandbox/src/components/Avatar.tsx
```

## Running the Storybook sandbox

```bash
cd examples/storybook-sandbox
npx storybook dev -p 6006
```

Open http://localhost:6006. The sandbox has one component per interesting
parsing case — extends, multi-level extends, discriminated unions, nested
interfaces, TS utility types — each with its own story, so you can see the
parsed props actually rendered in Storybook's Controls panel rather than as
raw JSON.

To produce a static build instead of a dev server:

```bash
npx storybook build
```

### How the sandbox is wired

`examples/storybook-sandbox/.storybook/main.ts` registers `@rdrp/vite-plugin`
two ways:

- via `viteFinal`, adding `rdrpDocgenPlugin()` — this is what attaches
  `Component.__docgenInfo` to every `.tsx` module at build time, the actual
  integration seam for Storybook's Vite builder (not the `typescript.
  reactDocgen` option in `main.ts`, which only toggles Storybook's *built-in*
  docgen choices and is turned off here).
- via `addons`, pointing at `@rdrp/vite-plugin/src/preset.js` — this
  registers a Storybook `argTypesEnhancer` that runs automatically for every
  story, so nothing needs to be imported or called per-story-file. It:
  - hides Controls fields that belong to a union branch other than the one
    the current story's args select (keyed off the branch discriminant)
  - fills in each visible field's branch-specific jsdoc description, where
    core's flattened view had to drop an ambiguous one
  - for a prop with a nested or union object shape, shows the original type
    name(s) as the clickable Type-column text, with the full expanded shape
    (recursively, for nested-interface-inside-interface cases) in the detail
    popover

## What core currently handles

- Plain interfaces/type aliases, required vs. optional props, jsdoc
  descriptions (component-level and per-prop), `@default` tags
- `extends`, including multi-level chains, in a single file
- Unions of primitives (`'a' | 'b' | 'c'`)
- Unions of objects, both as a single prop's type and as the whole `Props`
  type — split into branches with each branch's own props and jsdoc, plus a
  detected discriminant when one exists
- `Pick`, `Omit`, `Partial`, `Required`, `Record`
- Nested object props (a prop typed as another named interface), expanded up
  to 2 levels deep, with a cycle guard for self-referential types

Not yet handled: cross-file `extends` (importing a base interface from
another module), intersections (`A & B`), and generic components.
