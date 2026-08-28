import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Fully Supported/Nested Object Prop',
  component: Avatar,
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const OneLevelNesting: Story = {
  args: { user: { name: 'Ada Lovelace' }, size: 48 },
};

export const TwoLevelNesting: Story = {
  args: { user: { name: 'Ada Lovelace', employer: { company: 'Analytical Engines Ltd' } }, size: 48 },
};
