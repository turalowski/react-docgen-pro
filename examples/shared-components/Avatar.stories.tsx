import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Avatar',
  component: Avatar,
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {
  args: { user: { name: 'Ada Lovelace' }, size: 48 },
};
