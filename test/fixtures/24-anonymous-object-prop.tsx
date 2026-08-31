import React from 'react';

export interface AvatarUser {
  name: string;
}

/** A named type alias to an object literal — keeps its own name, same as an interface reference. */
export type ControlsShape = {
  visible: boolean;
};

export interface Props {
  /** Inline, unnamed object type — nothing to show as a summary but its own shape. */
  controls: {
    visible: boolean;
    label: string;
    disabled?: boolean;
  };
  /** Named interface reference — keeps its real name. */
  named: AvatarUser;
  /** Named type alias to an object literal — keeps its real name. */
  aliased: ControlsShape;
  /** Array of an inline, unnamed object type. */
  cards: { title: string }[];
  /** Array of primitives — untouched, nothing to expand. */
  names: string[];
}

export function Widget(props: Props) {
  return null;
}
