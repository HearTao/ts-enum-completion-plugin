import type * as ts from "typescript/lib/tsserverlibrary";

export interface SynchronizedConfiguration {}

export interface CompletionContext {
    file: ts.SourceFile;
    program: ts.Program;
}
