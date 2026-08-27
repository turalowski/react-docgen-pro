import React from 'react';

interface FullUserFields {
  /** Unique user id. */
  id: string;
  /** Full display name. */
  name: string;
  /** Email address, used for notifications. */
  email: string;
  /** Whether the account is currently active. */
  active: boolean;
}

export type Props = Pick<FullUserFields, 'id' | 'name'>;

export function UserBadge(props: Props) {
  return <span>{props.name}</span>;
}
