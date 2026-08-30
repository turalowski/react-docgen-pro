import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Parser/Unions & Enums/Discriminated Union',
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const TextBranch: Story = {
  args: { type: 'text', value: '', placeholder: 'Type here…' },
};

export const CheckboxGroupBranch: Story = {
  args: { type: 'checkboxGroup', values: ['a'], options: ['a', 'b', 'c'] },
};
