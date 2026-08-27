import React from 'react';

interface FullUserFields {
  /** Unique user id. */
  id: string;
  /** Full display name. */
  name: string;
}

export type Props = Partial<FullUserFields>;

export function UserBadge(props: Props) {
  return <span>{props.name}</span>;
}
