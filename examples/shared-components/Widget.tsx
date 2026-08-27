import React from 'react';

interface AProps {
  /** From the root of the chain. */
  id: string;
}

interface BProps extends AProps {
  /** Middle of the chain. */
  label: string;
}

/**
 * Sits at the bottom of a three-level extends chain: WidgetProps -> BProps -> AProps.
 */
export interface WidgetProps extends BProps {
  /** Called when the widget is clicked. */
  onClick?: () => void;
}

export function Widget(props: WidgetProps) {
  return (
    <button id={props.id} onClick={props.onClick}>
      {props.label}
    </button>
  );
}
