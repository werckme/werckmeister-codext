import { ISuggestion, LanguageFeatures } from "@werckmeister/language-features";
import * as vscode from 'vscode';
import { ActiveSourceDocument } from "./impl/SourceDocument";
import "regenerator-runtime/runtime";

export class AutoComplete {
    constructor(private languageFeatures: LanguageFeatures) {

    }
    
    private createItem(suggestion: ISuggestion): vscode.CompletionItem {
        return new vscode.CompletionItem(suggestion.text);
    }
    public async complete(document: vscode.TextDocument, position: vscode.Position, 
        token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[]> {
            const doc = new ActiveSourceDocument(document, position);
            try {
                const suggestions = await this.languageFeatures.autoComplete(doc);
                return suggestions.map(suggestion => this.createItem(suggestion));
            } catch(ex) {
                console.error("werckmeister suggestions error", ex);
                return [];
            }
    }
}