import type { Meta, StoryObj } from '@storybook/react';
import { SimpleComponent } from './SimpleComponent';

const meta: Meta<typeof SimpleComponent> = {
  title: 'Parser/Unions & Enums/Discriminated Union',
  component: SimpleComponent,
};
export default meta;

type Story = StoryObj<typeof SimpleComponent>;

export const LinkBranch: Story = {
  args: { label: 'Simple Component with different type of props', }
};

