import type { StorybookConfig } from '@storybook/react-vite';
import { viteLoader } from 'react-docgen-pro/vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  // Components live in examples/shared-components/, shared with the
  // webpack sandbox, so both prove the same fixtures rather than
  // maintaining two copies.
  stories: ['../../shared-components/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    // Registers argTypesEnhancers globally — Controls automatically
    // hides fields from non-active union branches on every story,
    // no per-story wiring needed.
    'react-docgen-pro/vite/preset',
  ],
  typescript: {
    // Turn off Storybook's built-in docgen entirely — we're supplying
    // __docgenInfo ourselves via the Vite plugin below, which is the
    // real integration seam for the Vite builder (see project notes).
    reactDocgen: false,
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins ??= [];
    viteConfig.plugins.push(viteLoader());
    return viteConfig;
  },
};

export default config;
