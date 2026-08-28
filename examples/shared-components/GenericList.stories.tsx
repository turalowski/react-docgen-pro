import type { Meta, StoryObj } from '@storybook/react';
import { GenericList } from './GenericList';

const meta: Meta<typeof GenericList> = {
  title: 'Not Yet Supported/Generic Components',
  component: GenericList,
};
export default meta;

type Story = StoryObj<typeof GenericList>;

export const UnresolvedTypeParameter: Story = {
  args: {
    items: ['Ada', 'Grace', 'Katherine'],
    renderItem: (item: unknown) => String(item),
  },
};
