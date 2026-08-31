import React from 'react';

/** A single tag attached to an item. */
export interface Tag {
  /** Unique id for the tag. */
  id: string;
  /** Display label. */
  label: string;
}

/** A tree node whose children are themselves tree nodes. */
export interface TreeNode {
  label: string;
  /** Child nodes, same shape as this one — self-referential through an array. */
  children: TreeNode[];
}

export interface Props {
  /** Tags attached to this item — an array of a plain object shape. */
  tags: Tag[];
  /** Plain string values — nothing to expand. */
  names: string[];
  /** Root of a tree. */
  root: TreeNode;
}

export function TagList(props: Props) {
  return null;
}
