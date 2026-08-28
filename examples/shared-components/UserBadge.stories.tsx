import type { Meta, StoryObj } from '@storybook/react';
import { UserBadge } from './UserBadge';

const meta: Meta<typeof UserBadge> = {
  title: 'Fully Supported/Utility Type - Pick',
  component: UserBadge,
};
export default meta;

type Story = StoryObj<typeof UserBadge>;

export const PickedFields: Story = {
  args: { id: 'u_1', name: 'Ada Lovelace' },
};
