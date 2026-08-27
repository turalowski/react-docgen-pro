export interface PropDescriptor {
  name: string;
  required: boolean;
  type: {
    /** Raw TS type text, e.g. "string", "'a' | 'b'" */
    name: string;
    /**
     * Present only when this prop's type is a union of object shapes
     * (e.g. `{type:'a',foo} | {type:'b',bar}`) — one entry per branch,
     * each with its own resolved props. This is what lets a rich
     * ArgsTable render per-variant fields instead of one opaque
     * stringified union.
     */
    elements?: UnionBranch[];
    /**
     * Present when this prop's type resolves to a plain object shape
     * (a named interface/type-alias reference, or an inline object
     * type) — its own fields, one level deep, each with jsdoc intact.
     * `name` stays the original reference (e.g. "AvatarUser") so the
     * type identity is still visible; this is the expanded shape
     * alongside it, not a replacement for it.
     */
    properties?: Record<string, PropDescriptor>;
  };
  description?: string;
  /** From an `@default` jsdoc tag, e.g. `@default 3` -> "3" */
  defaultValue?: { value: string };
}

export interface UnionBranch {
  /** The literal discriminant prop shared across all branches, if one exists (e.g. `type: 'a'`). */
  discriminant?: { name: string; value: string };
  props: Record<string, PropDescriptor>;
}

export interface Documentation {
  /** Name of the exported component/props type */
  displayName: string;
  description?: string;
  /**
   * Flattened prop set. When the top-level Props type is itself a
   * union of object shapes, this is only the properties common to
   * every branch (often empty) — variant-specific props, including
   * their jsdoc, live in `elements` instead. This is the exact gap
   * plain react-docgen has for a top-level union Props type: it
   * reports the flattened set and drops per-variant jsdoc entirely.
   */
  props: Record<string, PropDescriptor>;
  /**
   * Present only when the top-level Props type is a union of object
   * shapes (e.g. `type Props = AProps | BProps | ...`) — one entry
   * per branch, each with its own resolved props and jsdoc intact.
   */
  elements?: UnionBranch[];
}
