import type { StorybookConfig } from '@storybook/react-vite';
import type { StorybookConfig as WebpackStorybookConfig } from '@storybook/react-webpack5';

// STORYBOOK_BUILDER=webpack switches this sandbox to the webpack5
// builder; anything else (including unset) uses Vite. One app proves
// both integration seams instead of maintaining two near-identical
// sandboxes — see `npm run storybook` vs `npm run storybook:webpack`.
const useWebpack = process.env.STORYBOOK_BUILDER === 'webpack';

const config: StorybookConfig = {
  framework: useWebpack ? '@storybook/react-webpack5' : '@storybook/react-vite',
  stories: ['../shared-components/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    // Registers argTypesEnhancers globally — Controls automatically
    // hides fields from non-active union branches on every story, no
    // per-story wiring needed. Builder-agnostic: a preview annotation,
    // not tied to Vite's transform pipeline, so it works unchanged
    // under webpack5 too.
    'react-docgen-pro/vite/preset',
  ],
  typescript: {
    // Turn off Storybook's built-in docgen entirely — __docgenInfo is
    // supplied ourselves: via the Vite plugin below for the Vite
    // builder, or via the webpack loader below for webpack5.
    reactDocgen: false,
  },
  ...(useWebpack
    ? ({
      webpackFinal: async (webpackConfig) => {
        webpackConfig.module ??= { rules: [] };
        webpackConfig.module.rules ??= [];
        // Our docgen loader runs first (enforce: 'pre'), appending
        // plain JS to the raw source. It reads the file straight off
        // disk via react-docgen-pro rather than the in-flight
        // webpack source, so it doesn't actually need TSX to still
        // be valid TSX by the time it runs — only that whatever
        // text it receives still contains a recognizable
        // `export function X(` / `export const X =` for its
        // component-name regex, which is true before any transform.
        webpackConfig.module.rules.push({
          test: /\.tsx$/,
          exclude: /node_modules/,
          enforce: 'pre',
          // Plain specifier — webpack resolves it via its own
          // node_modules resolution, no need for require.resolve
          // (which isn't available in this ESM config file anyway).
          use: [{ loader: 'react-docgen-pro/webpack' }],
        });

        // Storybook 8.6's webpack5 builder doesn't transform .tsx
        // out of the box (its native "experiments.typescript" fast
        // path only supports plain .ts) — needs an explicit
        // TSX-capable loader.
        webpackConfig.module.rules.push({
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'esbuild-loader',
          // jsx: 'automatic' matches the Vite builder's default (via
          // @vitejs/plugin-react) — JSX compiles to calls into
          // react/jsx-runtime instead of `React.createElement`, so
          // stories/components don't need `import React from 'react'`
          // in scope just to use JSX.
          options: { loader: 'tsx', target: 'es2020', jsx: 'automatic' },
        });

        return webpackConfig;
      },
    } satisfies Partial<WebpackStorybookConfig>)
    : {
      async viteFinal(viteConfig) {
        const { viteLoader } = await import('react-docgen-pro/vite');
        viteConfig.plugins ??= [];
        viteConfig.plugins.push(viteLoader());
        // @storybook/react-vite doesn't add @vitejs/plugin-react itself
        // (it only wires up docgen, which we've turned off), so JSX
        // falls through to Vite's bare esbuild transform. That defaults
        // to the classic runtime (`React.createElement`, requiring
        // `React` in scope) unless told otherwise — set it to the
        // automatic runtime instead, same as the webpack path.
        viteConfig.esbuild = { ...viteConfig.esbuild, jsx: 'automatic' };
        return viteConfig;
      },
    }),
};

export default config;
