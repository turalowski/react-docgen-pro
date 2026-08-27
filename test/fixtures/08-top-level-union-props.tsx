import React from 'react';

export interface InputTextProps {
  /** Discriminant identifying this as a plain text input. */
  type: 'text';
  /** The current text value. */
  value: string;
  /** Placeholder shown when value is empty. */
  placeholder?: string;
}

export interface InputCheckboxGroupProps {
  /** Discriminant identifying this as a checkbox group. */
  type: 'checkboxGroup';
  /** The currently checked option values. */
  values: string[];
  /** All selectable options for the group. */
  options: string[];
}

/**
 * Props for the Input family of components — the concrete shape
 * depends on `type`.
 */
export type InputProps = InputTextProps | InputCheckboxGroupProps;

export function Input(props: InputProps) {
  return <div data-type={props.type} />;
}
