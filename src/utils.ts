import type * as ts from "typescript/lib/tsserverlibrary";

export function assert(v: any, message?: string): asserts v {
    if (!v) {
        throw new Error(message ?? "Assertion failed");
    }
}

export function findAllAncestorSymbols(
    typescript: typeof ts,
    node: ts.Node,
    checker: ts.TypeChecker
): readonly ts.Symbol[] {
    const symbolSets = new Set<ts.Symbol>();

    while (node) {
        if (node.locals) {
            node.locals.forEach(local => {
                const symbol =
                    local.flags & typescript.SymbolFlags.Alias
                        ? checker.getAliasedSymbol(local)
                        : local;
                symbolSets.add(symbol);
            });
        }
        node = node.parent;
    }

    return Array.from(symbolSets);
}

export function getCompletionText(
    name: string,
    parent: string,
    isIdentifierText: boolean
) {
    if (isIdentifierText) {
        return `${parent}.${name}`;
    }
    return `${parent}["${name}"]`;
}

export function isAccessExpressionOrQualifiedName(
    typescript: typeof ts,
    node: ts.Node
): node is ts.AccessExpression | ts.QualifiedName {
    return (
        typescript.isAccessExpression(node) || typescript.isQualifiedName(node)
    );
}

export function getLeftOfAccessExpressionOrQualifiedName(
    typescript: typeof ts,
    node: ts.AccessExpression | ts.QualifiedName
) {
    return typescript.isAccessExpression(node) ? node.expression : node.left;
}
