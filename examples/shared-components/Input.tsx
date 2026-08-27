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
  if (props.type === 'text') {
    return <input type="text" value={props.value} placeholder={props.placeholder} readOnly />;
  }
  return (
    <div>
      {props.options.map((option) => (
        <label key={option}>
          <input type="checkbox" checked={props.values.includes(option)} readOnly />
          {option}
        </label>
      ))}
    </div>
  );
}
