import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    options: {
      storySort: {
        method: 'alphabetical',
        // Every story here shares the same `title: 'Components'` —
        // without this, storySort skips comparing stories at all once
        // their titles match, leaving them in file-load order (i.e.
        // alphabetical by filename) regardless of the numeric prefixes
        // in each story's `name`. This makes it actually compare names.
        includeNames: true,
      }
    }
  },
};

export default preview;
