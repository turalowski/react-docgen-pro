import type { Meta, StoryObj } from '@storybook/react';
import { SimpleComponent } from './SimpleComponent';

const meta: Meta<typeof SimpleComponent> = {
  title: 'Components',
  component: SimpleComponent,
};
export default meta;

type Story = StoryObj<typeof SimpleComponent>;

export const Primary: Story = {
  name: '1. Simple Component',
  args: { label: 'Simple Component with different type of props', }
};

