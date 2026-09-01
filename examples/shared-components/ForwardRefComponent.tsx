import { forwardRef } from 'react';
import type { ActionItemProps } from './SimpleComponent';

export interface ForwardRefComponentProps extends ActionItemProps {
  /** Extra prop only available on the forwardRef version. */
  className?: string;
}

export const ForwardRefComponent = forwardRef<HTMLSpanElement, ForwardRefComponentProps>(
  function ForwardRefComponent(props, ref) {
    return (
      <span ref={ref} className={props.className}>
        {props.label}
      </span>
    );
  }
);
