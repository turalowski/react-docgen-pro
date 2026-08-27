// Storybook preset entry point, referenced from `addons` in
// .storybook/main.ts. Registers our argTypesEnhancer into
// `previewAnnotations` — the same mechanism a project's own
// .storybook/preview.ts uses — so it's actually bundled into the
// preview iframe and runs for every story automatically.
import { fileURLToPath } from 'node:url';

const enhancerPath = fileURLToPath(new URL('./argTypesEnhancer.js', import.meta.url));

export function previewAnnotations(entry = []) {
  return [...entry, enhancerPath];
}
