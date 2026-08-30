import type { Meta, StoryObj } from '@storybook/react';
import { ScheduleSettings } from './ScheduleSettings';

const meta: Meta<typeof ScheduleSettings> = {
  title: 'Parser/Advanced Utility Types/Required',
  component: ScheduleSettings,
};
export default meta;

type Story = StoryObj<typeof ScheduleSettings>;

export const Default: Story = {
  args: { timeZone: 'America/New_York', remindersEnabled: true },
};
