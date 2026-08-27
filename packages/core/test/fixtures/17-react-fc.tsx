import React from 'react';

interface IconProps {
  icon: string;
}

export interface Props {
  /** Button label. */
  label: string;
}

export const Button: React.FC<Props> = ({ label }) => {
  return <button>{label}</button>;
};
