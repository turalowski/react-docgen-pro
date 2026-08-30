import type { Meta, StoryObj } from '@storybook/react';
import { Greeting } from './Greeting';

const meta: Meta<typeof Greeting> = {
  title: 'Parser/Primitives & Basics/Optional vs Required Props',
  component: Greeting,
};
export default meta;

type Story = StoryObj<typeof Greeting>;

export const RequiredOnly: Story = {
  args: { name: 'Ada' },
};

export const OptionalProvided: Story = {
  args: { name: 'Ada', count: 3 },
};
