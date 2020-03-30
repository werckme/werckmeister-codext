import * as vscode from 'vscode';

export function isSamePath(pathA:string, pathB: string): boolean {
    const result = vscode.Uri.file(pathA).toString() === vscode.Uri.file(pathB).toString();
    return result;
}

export async function findDocument(filePath: string): Promise<vscode.TextDocument> {
   return vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
}