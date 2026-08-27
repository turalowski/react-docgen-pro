import type { Meta, StoryObj } from '@storybook/react';
import { UserSettingsForm } from './UserSettingsForm';

const meta: Meta<typeof UserSettingsForm> = {
  title: 'Utility Types/UserSettingsForm (Omit + Partial)',
  component: UserSettingsForm,
};
export default meta;

type Story = StoryObj<typeof UserSettingsForm>;

export const Empty: Story = {
  args: {},
};

export const Prefilled: Story = {
  args: { name: 'Ada Lovelace', email: 'ada@example.com', active: true },
};
