import React from 'react';

import type { CardProps, CardInternalProps } from './types';

// Mirrors a common real-world pattern: the props type lives in a
// sibling types.ts (not declared in this file at all), and the
// component's own parameter annotation is an intersection of the
// public props type with an internal-only one.
export function Card(props: CardProps & CardInternalProps) {
  return <div>{props.title}</div>;
}
