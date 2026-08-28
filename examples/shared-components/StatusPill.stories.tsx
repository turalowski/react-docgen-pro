import type { Meta, StoryObj } from '@storybook/react';
import { StatusPill, Status } from './StatusPill';

const meta: Meta<typeof StatusPill> = {
  title: 'Not Yet Supported/Enums',
  component: StatusPill,
};
export default meta;

type Story = StoryObj<typeof StatusPill>;

export const ResolvesToUnderlyingPrimitive: Story = {
  args: { status: Status.Active },
};
