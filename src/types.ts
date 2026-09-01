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
    /**
     * Present when this prop's type is itself a function (a named
     * function type alias, an `interface` call signature, or an inline
     * `(...) => ...` type) — one entry per parameter of its call
     * signature. Each parameter's own type is expanded the same way a
     * regular object prop's would be (via `properties`), but only when
     * it resolves to a type declared in the user's own project —
     * expanding a built-in like `MouseEvent` would just surface
     * TypeScript's own lib.dom.d.ts internals, which isn't what anyone
     * wants to see in a props table.
     */
    parameters?: ParameterDescriptor[];
    /**
     * Present alongside `parameters` — the call signature's return type,
     * expanded via `properties` under the same user-defined-only rule.
     */
    returnType?: FunctionTypePart;
  };
  description?: string;
  /** From an `@default` jsdoc tag, e.g. `@default 3` -> "3" */
  defaultValue?: { value: string };
}

export interface ParameterDescriptor {
  name: string;
  required: boolean;
  type: FunctionTypePart;
}

interface FunctionTypePart {
  name: string;
  /** Same rule as `PropDescriptor.type.properties` — only expanded for user-defined types, never for a built-in like `MouseEvent`. */
  properties?: Record<string, PropDescriptor>;
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
