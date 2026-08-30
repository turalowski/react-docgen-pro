export interface ScheduleSettingsFields {
  /** IANA time zone, e.g. "America/New_York". */
  timeZone?: string;
  /** Whether to send a reminder email. */
  remindersEnabled?: boolean;
}

// Required<T> forces every optional field back to mandatory — the
// opposite transform from the Omit + Partial pairing used elsewhere.
export type ScheduleSettingsProps = Required<ScheduleSettingsFields>;

export function ScheduleSettings(props: ScheduleSettingsProps) {
  return (
    <div>
      {props.timeZone} — reminders {props.remindersEnabled ? 'on' : 'off'}
    </div>
  );
}
