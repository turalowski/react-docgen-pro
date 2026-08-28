import type { Meta, StoryObj } from '@storybook/react';
import { FeatureFlags } from './FeatureFlags';

const meta: Meta<typeof FeatureFlags> = {
  title: 'Not Yet Supported/Mapped Types',
  component: FeatureFlags,
};
export default meta;

type Story = StoryObj<typeof FeatureFlags>;

export const HandRolledMappedType: Story = {
  args: { darkMode: true, betaBanner: false },
};
