import type { Meta, StoryObj } from '@storybook/react';
import { NavLink } from './NavLink';

const meta: Meta<typeof NavLink> = {
  title: 'Parser/Object Types/Named Interface Prop',
  component: NavLink,
};
export default meta;

type Story = StoryObj<typeof NavLink>;

export const SameTab: Story = {
  args: { label: 'Docs', target: { href: '/docs' } },
};

export const NewTab: Story = {
  args: { label: 'Docs', target: { href: '/docs', newTab: true } },
};
