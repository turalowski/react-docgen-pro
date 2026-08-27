import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Input',
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Text: Story = {
  args: { type: 'text', value: '', placeholder: 'Type here…' },
};

export const CheckboxGroup: Story = {
  args: { type: 'checkboxGroup', values: ['a'], options: ['a', 'b', 'c'] },
};
