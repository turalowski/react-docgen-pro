import React from 'react';

interface FullUserFields {
  /** Unique user id. */
  id: string;
  /** Full display name. */
  name: string;
  /** Email address, used for notifications. */
  email: string;
  /** Whether the account is currently active. */
  active: boolean;
}

/**
 * A form for editing an existing user's settings. `id` is excluded
 * (immutable, not user-editable) via Omit, and every remaining field
 * is optional via Partial — the form only sends the fields that
 * actually changed.
 */
export type UserSettingsFormProps = Partial<Omit<FullUserFields, 'id'>>;

export function UserSettingsForm(props: UserSettingsFormProps) {
  return (
    <form>
      <input defaultValue={props.name} placeholder="Name" />
      <input defaultValue={props.email} placeholder="Email" />
      <label>
        <input type="checkbox" defaultChecked={props.active} /> Active
      </label>
    </form>
  );
}
