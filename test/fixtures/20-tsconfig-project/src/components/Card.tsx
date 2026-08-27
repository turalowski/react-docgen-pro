import React from 'react';
import type { BaseProps } from '@base/BaseProps';

export interface CardProps extends BaseProps {
  title: string;
}

export function Card(props: CardProps) {
  return <div id={props.id}>{props.title}</div>;
}
