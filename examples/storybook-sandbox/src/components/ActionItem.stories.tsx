import type { Meta, StoryObj } from '@storybook/react';
import { ActionItem } from './ActionItem';

const meta: Meta<typeof ActionItem> = {
  title: 'ActionItem',
  component: ActionItem,
};
export default meta;

type Story = StoryObj<typeof ActionItem>;

export const AsLink: Story = {
  args: { label: 'Go to docs', action: { type: 'link', href: '/docs' } },
};
