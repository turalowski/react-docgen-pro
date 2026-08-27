import React from 'react';

/** Where the user works. */
export interface Employer {
  /** Company name. */
  company: string;
}

/** Describes the person shown by the avatar. */
export interface AvatarUser {
  /** Full display name. */
  name: string;
  /** URL of the profile photo; falls back to initials when absent. */
  photoUrl?: string;
  /** The user's employer — an interface nested inside an interface. */
  employer?: Employer;
}

export interface AvatarProps {
  /** The person to render — a nested object, not a flat prop. */
  user: AvatarUser;
  /** Diameter in pixels. */
  size?: number;
}

export function Avatar(props: AvatarProps) {
  const initials = props.user.name
    .split(' ')
    .map((part) => part[0])
    .join('');
  const size = props.size ?? 32;

  return props.user.photoUrl ? (
    <img src={props.user.photoUrl} alt={props.user.name} width={size} height={size} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#ccc' }}>{initials}</div>
  );
}
