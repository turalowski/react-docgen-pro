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
  const configPath = ts.findConfigFile(path.dirname(filePath), ts.sys.fileExists);
  if (!configPath) return FALLBACK_OPTIONS;

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
