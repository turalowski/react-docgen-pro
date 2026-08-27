import type { Meta, StoryObj } from '@storybook/react';
import { Widget } from './Widget';

const meta: Meta<typeof Widget> = {
  title: 'Widget',
  component: Widget,
};
export default meta;

type Story = StoryObj<typeof Widget>;

export const Default: Story = {
  args: { id: 'widget-1', label: 'Click me' },
};
