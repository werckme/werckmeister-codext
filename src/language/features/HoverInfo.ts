import { LanguageFeatures } from "@werckmeister/language-features";
import * as vscode from 'vscode';
import { ActiveSourceDocument } from "./impl/SourceDocument";
import "regenerator-runtime/runtime";

export class HoverInfo {
    constructor(private languageFeatures: LanguageFeatures) {

    }
    
    public async get(document: vscode.TextDocument, position: vscode.Position, 
        token: vscode.CancellationToken): Promise<vscode.Hover|null> {
            const doc = new ActiveSourceDocument(document, position);
            const wordAtPosition = document.getText(document.getWordRangeAtPosition(position));
            try {
                const suggestions = await this.languageFeatures.autoComplete(doc);
                const suggestionItem = suggestions.find(x => x.text === wordAtPosition);
                if (!suggestionItem || !suggestionItem.description) {
                    return null;
                }
                return new vscode.Hover(suggestionItem.description);
            } catch(ex) {
                console.error("werckmeister hover info error", ex);
                return null;
            }
    }
}