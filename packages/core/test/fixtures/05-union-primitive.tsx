import React from 'react';

export interface Props {
  /** Current lifecycle status. */
  status: 'idle' | 'loading' | 'error';

  /** A size in one of a few fixed steps. */
  size?: 1 | 2 | 3;

  /** Either an explicit string or nothing at all. */
  label: string | null;
}

export function StatusBadge(props: Props) {
  return <span data-status={props.status}>{props.label}</span>;
}
