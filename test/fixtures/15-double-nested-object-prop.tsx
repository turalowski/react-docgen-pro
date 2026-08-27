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
  /** The user's employer — an interface nested inside an interface. */
  employer: Employer;
}

/** A tree node that refers back to its own type — must not recurse forever. */
export interface TreeNode {
  label: string;
  /** Child nodes, same shape as this one. */
  child?: TreeNode;
}

export interface Props {
  user: AvatarUser;
  root: TreeNode;
}

export function Avatar(props: Props) {
  return <span>{props.user.name}</span>;
}
