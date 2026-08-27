import React from 'react';

type ByEmail = {
  /** Look the user up by email address. */
  email: string;
};

type ById = {
  /** Look the user up by numeric id. */
  id: number;
};

export interface Props {
  /** Identifies the user, one way or the other — no shared tag field. */
  lookup: ByEmail | ById;
}

export function UserLink(props: Props) {
  return <span>{JSON.stringify(props.lookup)}</span>;
}
