/** Describes where a link points. */
export interface LinkTarget {
  /** Destination URL. */
  href: string;
  /** Opens in a new tab when true. */
  newTab?: boolean;
}

export interface NavLinkProps {
  /** Visible link text. */
  label: string;
  /** Where the link points — a separately named interface, not inlined. */
  target: LinkTarget;
}

export function NavLink(props: NavLinkProps) {
  return (
    <a href={props.target.href} target={props.target.newTab ? '_blank' : undefined} rel="noreferrer">
      {props.label}
    </a>
  );
}
