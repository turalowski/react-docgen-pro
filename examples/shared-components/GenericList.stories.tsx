import type { Meta, StoryObj } from '@storybook/react';
import { GenericList } from './GenericList';

const meta: Meta<typeof GenericList> = {
  title: 'Parser/Generics/Generic Component Props',
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
