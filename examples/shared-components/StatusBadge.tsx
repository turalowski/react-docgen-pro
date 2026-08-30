export interface StatusBadgeProps {
  /** Current lifecycle status. */
  status: 'idle' | 'loading' | 'error';
  /** A size in one of a few fixed steps. */
  size?: 1 | 2 | 3;
}

export function StatusBadge(props: StatusBadgeProps) {
  const size = props.size ?? 1;
  return <span data-status={props.status} data-size={size}>{props.status}</span>;
}
