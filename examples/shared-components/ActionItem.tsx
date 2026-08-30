
type LinkAction = {
  /** Discriminant: this branch navigates to a URL. */
  type: 'link';
  /** Destination URL. */
  href: string;
};

type ButtonAction = {
  /** Discriminant: this branch runs a click handler instead of navigating. */
  type: 'button';
  /** Called when the action is triggered. */
  onClick: () => void;
};

export interface ActionItemProps {
  label: string;
  /** Either navigates somewhere or runs a handler, never both. */
  action: LinkAction | ButtonAction;
}

export function ActionItem(props: ActionItemProps) {
  return <span>{props.label}</span>;
}
