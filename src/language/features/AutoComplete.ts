import { LanguageFeatures } from "@werckmeister/language-features";
import * as vscode from 'vscode';

export class AutoComplete {
    constructor(private languageFeatures: LanguageFeatures) {

    }
    public async complete(document: vscode.TextDocument, position: vscode.Position, 
        token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[]> {
            return [new vscode.CompletionItem("TEST")];
    }
}