import React from 'react';

interface ByEmail {
  /** Look the user up by email address. */
  email: string;
}

interface ById {
  /** Look the user up by numeric id. */
  id: number;
}

/**
 * A union of objects with no shared discriminant field — branches are
 * still split out, but Storybook Controls can't auto-select one based
 * on args the way it can for a discriminated union.
 */
export interface UserLookupProps {
  lookup: ByEmail | ById;
}

export function UserLookup(props: UserLookupProps) {
  return <span>{JSON.stringify(props.lookup)}</span>;
}
