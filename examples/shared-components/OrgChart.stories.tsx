import type { Meta, StoryObj } from '@storybook/react';
import { OrgChart } from './OrgChart';

const meta: Meta<typeof OrgChart> = {
  title: 'Parser/Object Types/Nested Object Prop',
  component: OrgChart,
};
export default meta;

type Story = StoryObj<typeof OrgChart>;

export const DeepestLevelFallsBackToTypeName: Story = {
  args: {
    employee: {
      name: 'Ada Lovelace',
      department: { name: 'Engineering', building: { address: '1 Analytical Engine Way' } },
    },
  },
};
