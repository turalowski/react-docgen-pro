import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'Parser/Object Types/Intersection Types (A & B)',
  component: Tag,
};
export default meta;

type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: { color: '#eee', label: 'beta' },
};

export const RemovablePill: Story = {
  args: { color: '#dff', label: 'beta', pill: true, onRemove: () => {} },
};
