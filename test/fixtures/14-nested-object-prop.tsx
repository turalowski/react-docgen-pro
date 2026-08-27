import React from 'react';

/** Describes the person shown by the avatar. */
export interface AvatarUser {
  /** Full display name. */
  name: string;
  /** URL of the profile photo; falls back to initials when absent. */
  photoUrl?: string;
}

export interface Props {
  /** The person to render — a nested object, not a flat prop. */
  user: AvatarUser;
  /** Diameter in pixels. */
  size?: number;
}

export function Avatar(props: Props) {
  return <span>{props.user.name}</span>;
}
