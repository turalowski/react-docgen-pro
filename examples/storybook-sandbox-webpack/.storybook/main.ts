import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  framework: '@storybook/react-webpack5',
  // Components live in examples/shared-components/, shared with the
  // Vite sandbox, so both prove the same fixtures rather than
  // maintaining two copies.
  stories: ['../../shared-components/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    // Registers argTypesEnhancers globally — the same preset used by
    // the Vite sandbox. It's builder-agnostic (a preview annotation,
    // not tied to Vite's transform pipeline), so it works unchanged
    // here with the webpack5 builder.
    '@rdrp/vite-plugin/src/preset.js',
  ],
  typescript: {
    // Turn off Storybook's built-in docgen entirely — __docgenInfo is
    // supplied by our own webpack loader below.
    reactDocgen: false,
  },
  webpackFinal: async (webpackConfig) => {
    webpackConfig.module ??= { rules: [] };
    webpackConfig.module.rules ??= [];
    // Our docgen loader runs first (enforce: 'pre'), appending plain JS
    // to the raw source. It reads the file straight off disk via
    // @rdrp/core rather than the in-flight webpack source, so it
    // doesn't actually need TSX to still be valid TSX by the time it
    // runs — only that whatever text it receives still contains a
    // recognizable `export function X(` / `export const X =` for its
    // component-name regex, which is true before any transform.
    webpackConfig.module.rules.push({
      test: /\.tsx$/,
      exclude: /node_modules/,
      enforce: 'pre',
      // Plain specifier — webpack resolves it via its own node_modules
      // resolution, no need for require.resolve (which isn't available
      // in this ESM config file anyway).
      use: [{ loader: '@rdrp/webpack-loader' }],
    });

    // Storybook 8.6's webpack5 builder doesn't transform .tsx out of
    // the box (its native "experiments.typescript" fast path only
    // supports plain .ts) — needs an explicit TSX-capable loader.
    webpackConfig.module.rules.push({
      test: /\.tsx?$/,
      exclude: /node_modules/,
      loader: 'esbuild-loader',
      options: { loader: 'tsx', target: 'es2020' },
    });

    return webpackConfig;
  },
};

export default config;
