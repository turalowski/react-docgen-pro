import ts from 'typescript';
import path from 'node:path';

const FALLBACK_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipLibCheck: true,
  strict: true,
};

/**
 * Creates a ts.Program for a single entry file, using the *consuming
 * project's* real tsconfig.json when one can be found (walking up from
 * the file's directory), rather than a fixed set of compiler options.
 *
 * This matters beyond just matching the project's strictness settings:
 * without the real `baseUrl`/`paths`, any import that relies on a path
 * alias — including a cross-file `extends` base interface reached that
 * way — fails to resolve, silently degrading to whatever TS falls back
 * to rather than the actual project structure. Falls back to a fixed
 * set of reasonable defaults when no tsconfig.json is found (e.g. a
 * standalone fixture file with no project root), so parsing a bare
 * .tsx file in isolation still works.
 */
export function createProgramForFile(filePath: string): ts.Program {
  const options = resolveCompilerOptions(filePath);
  return ts.createProgram([filePath], options);
}

function resolveCompilerOptions(filePath: string): ts.CompilerOptions {
  const foundPath = ts.findConfigFile(path.dirname(filePath), ts.sys.fileExists);
  if (!foundPath) return FALLBACK_OPTIONS;

  const configPath = resolveSolutionStyleReferences(foundPath);

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) return FALLBACK_OPTIONS;

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );

  // A project's tsconfig may not set jsx at all if it doesn't compile
  // .tsx directly (e.g. relies on a bundler for that) — without it, TS
  // can't parse JSX syntax at all, so every component file would fail
  // outright. Fill it in rather than let real project configs break.
  return {
    ...parsed.options,
    jsx: parsed.options.jsx ?? ts.JsxEmit.ReactJSX,
  };
}

/**
 * A "solution-style" root tsconfig.json — `{ "files": [], "references":
 * [...] }`, common in real projects split into build/test/etc. sub-
 * projects — declares no compilerOptions of its own; the actual settings
 * (target, paths, jsx, ...) live in one of the referenced configs. Taking
 * such a root at face value silently produces near-empty options: no
 * `paths`, meaning any path-aliased import — including a cross-file
 * `extends` base interface reached that way — fails to resolve.
 *
 * Follows the first `references` entry (recursively, depth-bounded)
 * until landing on a config that either declares its own compilerOptions
 * (which may itself `extends` a base config — parseJsonConfigFileContent
 * follows that chain natively) or has no further references to follow.
 */
function resolveSolutionStyleReferences(configPath: string, depth = 0): string {
  if (depth > 5) return configPath;

  const raw = ts.readConfigFile(configPath, ts.sys.readFile);
  if (raw.error || !raw.config) return configPath;

  const hasOwnOptions =
    raw.config.compilerOptions && Object.keys(raw.config.compilerOptions).length > 0;
  const references: unknown = raw.config.references;

  if (hasOwnOptions || !Array.isArray(references) || references.length === 0) {
    return configPath;
  }

  const firstRef = references[0] as { path?: string };
  if (!firstRef?.path) return configPath;

  const refTarget = path.resolve(path.dirname(configPath), firstRef.path);
  const nextConfigPath = ts.sys.fileExists(refTarget)
    ? refTarget
    : path.join(refTarget, 'tsconfig.json');

  if (!ts.sys.fileExists(nextConfigPath)) return configPath;

  return resolveSolutionStyleReferences(nextConfigPath, depth + 1);
}
