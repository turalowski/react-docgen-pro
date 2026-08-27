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
 * Sits at the bottom of a three-level extends chain: Props -> BProps -> AProps.
 */
export interface Props extends BProps {
  /** Own prop, not inherited. */
  onClick?: () => void;
}

export function Widget(props: Props) {
  return <div id={props.id} onClick={props.onClick}>{props.label}</div>;
}
