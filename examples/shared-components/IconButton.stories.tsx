import type { Meta, StoryObj } from '@storybook/react';
import {
  IconButtonFunctionDeclaration,
  IconButtonFC,
  IconButtonForwardRef,
  IconButtonMemo,
} from './IconButton';

const meta: Meta = {
  title: 'Parser/React-specific/Component Declaration Styles (FC, forwardRef, memo)',
};
export default meta;

export const FunctionDeclaration: StoryObj<typeof IconButtonFunctionDeclaration> = {
  render: (args) => <IconButtonFunctionDeclaration {...args} />,
  args: { label: 'Save' },
};

export const ReactFC: StoryObj<typeof IconButtonFC> = {
  render: (args) => <IconButtonFC {...args} />,
  args: { label: 'Save' },
};

export const ForwardRef: StoryObj<typeof IconButtonForwardRef> = {
  render: (args) => <IconButtonForwardRef {...args} />,
  args: { label: 'Save' },
};

export const Memo: StoryObj<typeof IconButtonMemo> = {
  render: (args) => <IconButtonMemo {...args} />,
  args: { label: 'Save' },
};
