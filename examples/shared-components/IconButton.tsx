import { forwardRef, memo } from 'react';
import type React from 'react';

export interface IconButtonProps {
  /** Button label. */
  label: string;
}

// Same props type, four different ways of declaring the component —
// react-docgen-pro should resolve `IconButtonProps` identically for
// all of them.

export function IconButtonFunctionDeclaration(props: IconButtonProps) {
  return <button>{props.label}</button>;
}

export const IconButtonFC: React.FC<IconButtonProps> = ({ label }) => {
  return <button>{label}</button>;
};

export const IconButtonForwardRef = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  return <button ref={ref}>{props.label}</button>;
});

export const IconButtonMemo = memo(({ label }: IconButtonProps) => {
  return <button>{label}</button>;
});
