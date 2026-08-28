import type { Meta, StoryObj } from '@storybook/react';
import { UserLookup } from './UserLookup';

const meta: Meta<typeof UserLookup> = {
  title: 'Partially Supported/Non-discriminated Union',
  component: UserLookup,
};
export default meta;

type Story = StoryObj<typeof UserLookup>;

export const ByEmailBranch: Story = {
  args: { lookup: { email: 'ada@example.com' } },
};

export const ByIdBranch: Story = {
  args: { lookup: { id: 42 } },
};
