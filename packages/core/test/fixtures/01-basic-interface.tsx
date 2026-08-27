import React from 'react';

export interface Props {
  /** The user's display name */
  name: string;
  /** Number of times to greet */
  count?: number;
}

export function Greeting(props: Props) {
  return <div>Hello {props.name}</div>;
}
