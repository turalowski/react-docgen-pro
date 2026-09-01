import type { Meta, StoryObj } from '@storybook/react';
import { HigherOrderComponent } from './withExtraProps';

const meta: Meta<typeof HigherOrderComponent> = {
  title: 'Components',
  component: HigherOrderComponent,
};
export default meta;

type Story = StoryObj<typeof HigherOrderComponent>;

export const HOC: Story = {
  name: '3. Higher Order Component',
  args: {
    label: 'Simple Component wrapped with a higher order component',
  },
};
