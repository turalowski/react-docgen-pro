import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Fully Supported/Interface Extends',
  component: Card,
};
export default meta;

type Story = StoryObj<typeof Card>;

export const RequiredProps: Story = {
  args: { id: 'card-1', title: 'Card title' },
};

export const OptionalPropsFilled: Story = {
  args: { id: 'card-2', title: 'Card title', footer: 'Last updated today', className: 'elevated' },
};
