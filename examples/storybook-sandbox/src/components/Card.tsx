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
export interface CardProps extends BaseProps {
  title: string;
  /** Rendered below the title. */
  footer?: string;
}

export function Card(props: CardProps) {
  return (
    <div id={props.id} className={props.className}>
      <h3>{props.title}</h3>
      {props.footer ? <footer>{props.footer}</footer> : null}
    </div>
  );
}
