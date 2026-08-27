import React from 'react';

interface BaseProps {
  /** Unique identifier for the element. */
  id: string;
  /** Extra class names to apply. */
  className?: string;
}

/**
 * A card that displays a title and optional footer.
 */
export interface Props extends BaseProps {
  title: string;
  /** Rendered below the title. */
  footer?: string;
}

export function Card(props: Props) {
  return <div id={props.id} className={props.className}>{props.title}</div>;
}
