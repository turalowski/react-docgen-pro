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

/**
 * Only needs id + name to render — built from FullUserFields via
 * Pick so it stays in sync if that shape changes elsewhere.
 */
export type UserBadgeProps = Pick<FullUserFields, 'id' | 'name'>;

export function UserBadge(props: UserBadgeProps) {
  return <span data-user-id={props.id}>{props.name}</span>;
}
