import ts from 'typescript';

/**
 * Creates a minimal ts.Program for a single entry file, using the
 * TS defaults. Later this gets replaced with real tsconfig resolution
 * + a LanguageService for incremental re-parses; for now, simplest
 * thing that lets us drive a Program + TypeChecker off one fixture.
 */
export function createProgramForFile(filePath: string): ts.Program {
  return ts.createProgram([filePath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: true,
  });
}
