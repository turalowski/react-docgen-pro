export interface CommonProps {
  /** Custom HTML class for the element. */
  customClass?: string;
}

/** Props for the Card component. */
export interface CardProps extends CommonProps {
  /** The card's title text. */
  title: string;
}

/** Internal-only props, not meant for external consumers. */
export interface CardInternalProps {
  /** Used only by internal tooling; not part of the public API. */
  internalDebugId?: string;
}
