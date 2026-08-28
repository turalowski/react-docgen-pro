import type { Meta, StoryObj } from '@storybook/react';
import { Widget } from './Widget';

const meta: Meta<typeof Widget> = {
  title: 'Fully Supported/Multi-level Extends Chain',
  component: Widget,
};
export default meta;

type Story = StoryObj<typeof Widget>;

export const ThreeLevelChain: Story = {
  args: { id: 'widget-1', label: 'Click me' },
};
