import React from 'react';

/** Visual styling for the tag. */
export interface TagAppearance {
  /** Background color. */
  color: string;
  /** Renders with rounded corners when true. */
  pill?: boolean;
}

/** Behavior for the tag. */
export interface TagBehavior {
  /** Text shown inside the tag. */
  label: string;
  /** Click handler. */
  onRemove?: () => void;
}

// Intersection of two unrelated interfaces (`A & B`) — distinct from
// `extends`, which merges a subtype relationship rather than two
// independent shapes.
export type TagProps = TagAppearance & TagBehavior;

export function Tag(props: TagProps) {
  return (
    <span style={{ background: props.color, borderRadius: props.pill ? 999 : 4 }}>
      {props.label}
      {props.onRemove ? <button onClick={props.onRemove}>×</button> : null}
    </span>
  );
}
