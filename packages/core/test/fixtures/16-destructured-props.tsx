import React from 'react';

interface IconProps {
  icon: string;
}

export interface Props {
  /** Button label. */
  label: string;
  /** Click handler. */
  onClick: () => void;
}

export function Button({ label, onClick }: Props) {
  return <button onClick={onClick}>{label}</button>;
}
