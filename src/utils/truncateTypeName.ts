/**
 * Caps a rendered type-name string (`checker.typeToString(...)` output)
 * at `maxLength` characters, replacing the overflow with a single `…`.
 *
 * `checker.typeToString` has no length limit of its own — a utility-type
 * chain like `JssSupportedProperty<Pick<RheaTextProps, "content" |
 * "ariaLabel" | "semanticTag" | ...>>` can run to hundreds of characters,
 * which overflows fixed-width UI (e.g. Storybook's ArgsTable) instead of
 * wrapping. Truncating here, once, at the source keeps every consumer of
 * `Documentation` simple — no repeated CSS `text-overflow` workarounds
 * downstream, and the same cap applies whether the value ends up in a
 * table cell, a tooltip, or a JSON dump.
 *
 * `maxLength` of `Infinity` (or any falsy/`<= 0` value skipped by the
 * caller) disables truncation entirely.
 */
export function truncateTypeName(name: string, maxLength: number): string {
  if (maxLength === Infinity || name.length <= maxLength) return name;
  if (maxLength <= 1) return '…';
  return `${name.slice(0, maxLength - 1)}…`;
}
