import type { StorybookConfig } from '@storybook/react-vite';
import { rdrpDocgenPlugin } from '@rdrp/vite-plugin';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    // Registers argTypesEnhancers globally — Controls automatically
    // hides fields from non-active union branches on every story,
    // no per-story wiring needed.
    '@rdrp/vite-plugin/src/preset.js',
  ],
  typescript: {
    // Turn off Storybook's built-in docgen entirely — we're supplying
    // __docgenInfo ourselves via the Vite plugin below, which is the
    // real integration seam for the Vite builder (see project notes).
    reactDocgen: false,
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(rdrpDocgenPlugin());
    return viteConfig;
  },
};

export default config;
