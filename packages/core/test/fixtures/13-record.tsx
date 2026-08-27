import React from 'react';

export type Props = Record<'small' | 'medium' | 'large', number>;

export function SizeMap(props: Props) {
  return <span>{props.small}</span>;
}
