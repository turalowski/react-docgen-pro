import React from 'react';

/**
 * `onConfirm`/`onCancel` are recorded by their signature string only —
 * there's no structured breakdown of the callback's parameter or
 * return types.
 */
export interface ConfirmDialogProps {
  message: string;
  /** Called with the user's typed confirmation text. */
  onConfirm: (confirmationText: string) => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <div>
      <p>{props.message}</p>
      <button onClick={() => props.onConfirm('yes')}>Confirm</button>
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  );
}
