import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Parser/Unions & Enums/String Literal Union',
  component: StatusBadge,
};
export default meta;

type Story = StoryObj<typeof StatusBadge>;

export const Idle: Story = {
  args: { status: 'idle' },
};

export const LoadingWithSize: Story = {
  args: { status: 'loading', size: 2 },
};
