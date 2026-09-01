import type { Meta, StoryObj } from '@storybook/react';
import { ForwardRefComponent } from './ForwardRefComponent';

const meta: Meta<typeof ForwardRefComponent> = {
  title: 'Components',
  component: ForwardRefComponent,
};
export default meta;

type Story = StoryObj<typeof ForwardRefComponent>;

export const WithForwardRef: Story = {
  name: '2. With Forward Ref',
  args: {
    label: 'Simple Component wrapped with forwardRef',
    className: 'simple-component',
  },
};
