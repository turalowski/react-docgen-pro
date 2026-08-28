import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmDialog } from './ConfirmDialog';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Not Yet Supported/Function-typed Props',
  component: ConfirmDialog,
};
export default meta;

type Story = StoryObj<typeof ConfirmDialog>;

export const SignatureOnlyNoParamBreakdown: Story = {
  args: {
    message: 'Delete this item?',
    onConfirm: (confirmationText: string) => console.log(confirmationText),
    onCancel: () => {},
  },
};
