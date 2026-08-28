import type { Meta, StoryObj } from '@storybook/react';
import { ActionItem } from './ActionItem';

const meta: Meta<typeof ActionItem> = {
  title: 'Fully Supported/Discriminated Union (single prop)',
  component: ActionItem,
};
export default meta;

type Story = StoryObj<typeof ActionItem>;

export const LinkBranch: Story = {
  args: { label: 'Go to docs', action: { type: 'link', href: '/docs' } },
};

export const ButtonBranch: Story = {
  args: { label: 'Dismiss', action: { type: 'button', onClick: () => {} } },
};
