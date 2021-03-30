import type * as ts from "typescript/lib/tsserverlibrary";
import "open-typescript";

import { ICustomizedLanguageServie } from "./decorator";
import { LanguageServiceLogger } from "./logger";

import { assert, findAllAncestorSymbols, getCompletionText } from "./utils";
import { CompletionContext } from "./types";

export class CustomizedLanguageService implements ICustomizedLanguageServie {
    constructor(
        private readonly info: ts.server.PluginCreateInfo,
        private readonly typescript: typeof ts,
        private readonly logger: LanguageServiceLogger
    ) {}

    getCompletionsAtPosition(
        fileName: string,
        position: number
    ): ts.WithMetadata<ts.CompletionInfo> | undefined {
        this.logger.log("[getCompletionsAtPosition]");

        const typescript = this.typescript;
        const context = this.getCompletionContext(fileName);
        if (!context) {
            this.logger.log("Create context failed");
            return undefined;
        }

        const { file, program } = context;
        const currentToken = typescript.findPrecedingToken(position, file);
        if (
            !currentToken ||
            !typescript.isIdentifier(currentToken) ||
            typescript.isAccessExpression(currentToken.parent) ||
            typescript.isQualifiedName(currentToken.parent)
        ) {
            this.logger.log(
                "Token check failed: " +
                    typescript.SyntaxKind[currentToken?.kind!]
            );
            return undefined;
        }

        const checker = program.getTypeChecker();
        const symbols = findAllAncestorSymbols(
            typescript,
            currentToken,
            checker
        );
        const enumSymbols = symbols.filter(
            symbol => symbol.flags & typescript.SymbolFlags.Enum
        );
        if (!enumSymbols.length) {
            this.logger.log("enum symbols check failed: " + symbols.length);
            return undefined;
        }

        const text = currentToken.text as ts.__String;
        const entries: ts.CompletionEntry[] = [];
        const compilerOptions = program.getCompilerOptions();
        enumSymbols.forEach(symbol => {
            if (symbol.exports?.has(text)) {
                const member = symbol.exports.get(text);
                assert(member);

                if (!(member.flags & typescript.SymbolFlags.EnumMember)) {
                    return;
                }

                const isIdentifierText = typescript.isIdentifierText(
                    member.name,
                    compilerOptions.target,
                    typescript.getLanguageVariant(file.scriptKind)
                );
                const completionText = getCompletionText(
                    member.name,
                    symbol.name,
                    isIdentifierText
                );
                entries.push({
                    name: completionText,
                    insertText: completionText,
                    replacementSpan: typescript.createTextSpanFromNode(
                        currentToken
                    ),
                    kind: typescript.ScriptElementKind.enumMemberElement,
                    sortText: typescript.Completions.SortText.LocationPriority
                });
            }
        });

        return {
            isGlobalCompletion: false,
            isNewIdentifierLocation: false,
            isMemberCompletion: false,
            entries
        };
    }

    getCompletionContext(fileName: string): CompletionContext | undefined {
        const program = this.info.languageService.getProgram();
        if (!program) {
            this.logger.log("Cannot find program");
            return undefined;
        }

        const file = program.getSourceFile(fileName);
        if (!file) {
            this.logger.log("Cannot find source file");
            return undefined;
        }

        return {
            file,
            program
        };
    }
}
