import type { Meta, StoryObj } from '@storybook/react';
import { UserSettingsForm } from './UserSettingsForm';

const meta: Meta<typeof UserSettingsForm> = {
  title: 'Parser/Advanced Utility Types/Omit + Partial',
  component: UserSettingsForm,
};
export default meta;

type Story = StoryObj<typeof UserSettingsForm>;

export const AllOptionalEmpty: Story = {
  args: {},
};

export const AllOptionalFilled: Story = {
  args: { name: 'Ada Lovelace', email: 'ada@example.com', active: true },
};
