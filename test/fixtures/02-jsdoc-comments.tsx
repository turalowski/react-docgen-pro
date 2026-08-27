import React from 'react';

/**
 * A button that triggers an action.
 *
 * Supports primary and secondary visual styles.
 */
export interface Props {
  /**
   * Visual style of the button.
   * Use "primary" for the main call to action on a page.
   * @default 'secondary'
   */
  variant?: 'primary' | 'secondary';

  /** Disables the button and prevents interaction. */
  disabled?: boolean;

  label: string;
}

export function Button(props: Props) {
  return <button disabled={props.disabled}>{props.label}</button>;
}
