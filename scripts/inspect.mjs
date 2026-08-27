// Quick manual check: prints parse() output for a fixture file.
// Requires a build first (npm run build).
// Usage: node scripts/inspect.mjs test/fixtures/01-basic-interface.tsx
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] ?? 'test/fixtures/01-basic-interface.tsx';
const filePath = path.resolve(__dirname, '..', target);

const { parse } = await import('../dist/index.js');
console.log(JSON.stringify(parse(filePath), null, 2));
