import React, { forwardRef } from 'react';

interface IconProps {
  icon: string;
}

export interface Props {
  /** Button label. */
  label: string;
}

export const Button = forwardRef<HTMLButtonElement, Props>((props, ref) => {
  return (
    <button ref={ref}>{props.label}</button>
  );
});
