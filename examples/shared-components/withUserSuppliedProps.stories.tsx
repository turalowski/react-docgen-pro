import type { Meta, StoryObj } from '@storybook/react';
import { ComponentWithUserSuppliedProps } from './withUserSuppliedProps';

const meta: Meta<typeof ComponentWithUserSuppliedProps> = {
  title: 'Components',
  component: ComponentWithUserSuppliedProps,
};
export default meta;

type Story = StoryObj<typeof ComponentWithUserSuppliedProps>;

export const WithUserSuppliedProps: Story = {
  name: '4. Higher Order Component with Extra Props',
  args: {
    label: 'Simple Component wrapped with a HOC that forwards caller-supplied props',
    variant: 'primary',
  },
};
