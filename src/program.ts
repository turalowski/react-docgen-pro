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

// Every file parsed with the same effective compiler options (i.e. every
// file under the same resolved tsconfig, or every file that falls back to
// FALLBACK_OPTIONS) shares one long-lived ts.LanguageService instead of
// getting its own throwaway ts.Program. A LanguageService reparses only
// the files whose version actually changed since the last getProgram()
// call — it re-checks the rest (React's own types, lib.dom.d.ts, sibling
// component files already seen) from its cached ASTs. Building a fresh
// ts.Program per file, as this used to do, redid that shared work (often
// hundreds of files' worth of parsing/binding) on every single call —
// the dominant cost behind slow Storybook startup with many components.
//
// Keyed by resolved tsconfig path (or FALLBACK_KEY when none is found),
// since that's exactly the granularity at which compiler options — and
// therefore which files can safely share one Program — are the same.
const FALLBACK_KEY = '\0fallback';

interface ProjectEntry {
  service: ts.LanguageService;
  rootFiles: Set<string>;
  versions: Map<string, number>;
}

const projectCache = new Map<string, ProjectEntry>();

// Memoizes the two filesystem walks resolveCompilerOptions used to redo
// on every call: ts.findConfigFile (per directory) and reading/parsing
// the tsconfig it finds (per resolved config path). Many files share a
// directory or a tsconfig, so this turns O(files) I/O into O(directories)
// + O(tsconfigs).
const configPathByDir = new Map<string, string | null>();
const optionsByConfigPath = new Map<string, ts.CompilerOptions>();
const registry = ts.createDocumentRegistry();

/**
 * Returns a ts.Program that has `filePath` up to date and ready to read,
 * reusing a shared per-project ts.LanguageService rather than building a
 * new ts.Program from scratch on every call. See the module comment above
 * for why that distinction matters.
 *
 * Uses the *consuming project's* real tsconfig.json when one can be found
 * (walking up from the file's directory), rather than a fixed set of
 * compiler options.
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
  const { key, options, projectDir } = resolveProjectForFile(filePath);
  const entry = getOrCreateProject(key, options, projectDir);

  entry.rootFiles.add(filePath);
  // Always bump the requested file's own version so its content is
  // re-read from disk on every call (needed for correctness across
  // repeated parse() calls / watch-mode edits) — sibling files already
  // in rootFiles keep their cached version, which is what lets the
  // LanguageService skip re-parsing them.
  entry.versions.set(filePath, (entry.versions.get(filePath) ?? 0) + 1);

  const program = entry.service.getProgram();
  if (!program) {
    throw new Error(`Could not build a TypeScript program for: ${filePath}`);
  }
  return program;
}

function resolveProjectForFile(filePath: string): {
  key: string;
  options: ts.CompilerOptions;
  projectDir: string;
} {
  const configPath = resolveConfigPathForDir(path.dirname(filePath));

  if (!configPath) {
    return { key: FALLBACK_KEY, options: FALLBACK_OPTIONS, projectDir: process.cwd() };
  }

  let options = optionsByConfigPath.get(configPath);
  if (!options) {
    options = readCompilerOptions(configPath);
    optionsByConfigPath.set(configPath, options);
  }
  return { key: configPath, options, projectDir: path.dirname(configPath) };
}

function resolveConfigPathForDir(dir: string): string | null {
  if (configPathByDir.has(dir)) return configPathByDir.get(dir) ?? null;

  const foundPath = ts.findConfigFile(dir, ts.sys.fileExists);
  const resolved = foundPath ? resolveSolutionStyleReferences(foundPath) : null;
  configPathByDir.set(dir, resolved);
  return resolved;
}

function readCompilerOptions(configPath: string): ts.CompilerOptions {
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

function getOrCreateProject(
  key: string,
  options: ts.CompilerOptions,
  projectDir: string
): ProjectEntry {
  const cached = projectCache.get(key);
  if (cached) return cached;

  const rootFiles = new Set<string>();
  const versions = new Map<string, number>();

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => [...rootFiles],
    getScriptVersion: (fileName) => String(versions.get(fileName) ?? 0),
    getScriptSnapshot: (fileName) => {
      if (!ts.sys.fileExists(fileName)) return undefined;
      const text = ts.sys.readFile(fileName);
      return text !== undefined ? ts.ScriptSnapshot.fromString(text) : undefined;
    },
    getCurrentDirectory: () => projectDir,
    getCompilationSettings: () => options,
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    realpath: ts.sys.realpath,
  };

  const entry: ProjectEntry = {
    service: ts.createLanguageService(host, registry),
    rootFiles,
    versions,
  };
  projectCache.set(key, entry);
  return entry;
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
