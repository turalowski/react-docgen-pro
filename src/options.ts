/** Consumer-facing configuration for {@link parse}. */
export interface ParseOptions {
  /**
   * Maximum characters allowed in a rendered type-name string (a prop's
   * `type.name`, a union branch's merged type text, or the component
   * displayName's stringified-type fallback) before it's truncated with
   * a trailing `…`. Long utility-type chains like
   * `JssSupportedProperty<Pick<RheaTextProps, "content" | "ariaLabel" |
   * ...>>` otherwise render at full length and overflow fixed-width UI.
   *
   * Pass `Infinity` to disable truncation entirely.
   *
   * @default 50
   */
  maxTypeNameLength?: number;

  /** How many levels of nested object props get expanded into `type.properties`. @default 2 */
  maxDepth?: number;
}

export interface ResolvedParseOptions {
  maxTypeNameLength: number;
  maxDepth: number;
}

export const DEFAULT_PARSE_OPTIONS: ResolvedParseOptions = {
  maxTypeNameLength: 50,
  maxDepth: 2,
};

export function resolveOptions(options?: ParseOptions): ResolvedParseOptions {
  return {
    maxTypeNameLength: options?.maxTypeNameLength ?? DEFAULT_PARSE_OPTIONS.maxTypeNameLength,
    maxDepth: options?.maxDepth ?? DEFAULT_PARSE_OPTIONS.maxDepth,
  };
}
