import type * as ts from "typescript/lib/tsserverlibrary";
import { EnumValueCompletionPlugin } from "./plugin";

export = (mod: { typescript: typeof ts }) =>
    new EnumValueCompletionPlugin(mod.typescript);
