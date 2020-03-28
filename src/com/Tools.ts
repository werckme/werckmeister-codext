import * as vscode from 'vscode';

export function isSamePath(pathA:string, pathB: string): boolean {
    const result = vscode.Uri.file(pathA).toString() === vscode.Uri.file(pathB).toString();
    return result;
}

export function findDocument(filePath: string): vscode.TextDocument | undefined {
    return vscode
        .workspace
        .textDocuments
        .filter(x => isSamePath(x.fileName, filePath))
        [0]
    ;
}