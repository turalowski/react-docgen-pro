# Changelog

## 2.0.0 — 2026-09-01

Initial public release. Earlier `1.0.x` / `1.0.4` versions have been unpublished from npm; `2.0.0` is the first supported version of `react-docgen-pro`.

### Features

- **TypeScript-aware props parsing** built on the TypeScript compiler API (not string-based heuristics like `react-docgen`/`react-docgen-typescript`).
- **Named interfaces** rendered as clickable references that expand to show the full interface structure, not just the name.
- **Anonymous interfaces** rendered as a clickable `Props` reference instead of a raw stringified type.
- **Arrays of named/anonymous interfaces** resolved the same way as their non-array counterparts.
- **Union types**:
  - Union of primitives renders each member type by name.
  - Union of interfaces renders clickable names for each branch, each expandable to its own structure.
  - Storybook argTypes enhancer (`react-docgen-pro/vite/preset`) hides Controls fields that don't apply to the currently active union branch and fills in branch-specific descriptions automatically.
- **Nested object props** expanded into structured `type.properties`, up to a configurable depth (`maxDepth`, default `2`).
- **Utility types** (`Pick`, `Omit`, `Partial`, `Required`, etc.) rendered as a clickable, expandable definition rather than just the utility name.
- **Function props**:
  - Named function types resolve to their interface name, with a popup showing full arguments and return type.
  - Anonymous functions render a clickable summary string with detailed argument/return info.
  - Anonymous functions taking an interface argument show a clickable popup for that interface's structure.
- **Component pattern support**: `React.FC`, `forwardRef`, `memo`, and HOC-wrapped components all resolve props correctly.
- **JSDoc support**: prop-level JSDoc comments (including on individual union branches) are preserved and surfaced, instead of disappearing for optional/union props.
- **`Component.__docgenInfo` output**: attaches docgen info in the same convention `react-docgen-typescript` uses, so Storybook's addon-docs and Controls panel work with no other config changes.
- **Vite integration** (`react-docgen-pro/vite`): a Vite plugin (`viteLoader`) for wiring parsed docgen info into a Storybook + Vite setup.
- **Webpack integration** (`react-docgen-pro/webpack`): a webpack loader for wiring parsed docgen info into a Storybook + webpack setup, with the same options as the Vite loader.
- **Shared Storybook preset** (`react-docgen-pro/vite/preset`): builder-agnostic addon that registers the argTypes enhancer for either setup.
- **Respects the consuming project's `tsconfig.json`** when resolving types, rather than relying on a bundled/default config.
- **Configurable output**:
  - `maxTypeNameLength` (default `50`) — caps rendered type-name strings (prop types, union branches, fallback display names), truncating with `…`; set to `Infinity` to disable.
  - `maxDepth` (default `2`) — controls how many levels of nested object props are expanded.
- **Direct API**: `parse(filePath, options)` for getting parsed props as JSON without going through a bundler integration.
