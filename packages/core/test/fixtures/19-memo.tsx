import React, { memo } from 'react';

interface IconProps {
  icon: string;
}

export interface Props {
  /** Button label. */
  label: string;
}

export const Button = memo(({ label }: Props) => {
  return <button>{label}</button>;
});
