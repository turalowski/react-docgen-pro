import React from 'react';

/**
 * Resolved to its underlying primitive (`string`) rather than the
 * individual member names (`Active`, `Paused`, `Archived`) when used
 * as a prop's type.
 */
export enum Status {
  Active = 'active',
  Paused = 'paused',
  Archived = 'archived',
}

export interface StatusPillProps {
  status: Status;
}

export function StatusPill(props: StatusPillProps) {
  return <span data-status={props.status}>{props.status}</span>;
}
