import React from 'react';

interface Features {
  darkMode: boolean;
  betaBanner: boolean;
}

/**
 * A hand-rolled mapped type over `Features`, beyond the built-in
 * `Partial`/`Required`/`Record`/`Pick`/`Omit` helpers — not resolved
 * field-by-field.
 */
export type FeatureFlagsProps = {
  [K in keyof Features]: boolean;
};

export function FeatureFlags(props: FeatureFlagsProps) {
  return <span>{JSON.stringify(props)}</span>;
}
