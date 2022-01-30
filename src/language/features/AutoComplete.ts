import { ISuggestion, LanguageFeatures, IPathSuggestion } from "@werckmeister/language-features";
import * as vscode from 'vscode';
import { ActiveSourceDocument } from "./impl/SourceDocument";
import "regenerator-runtime/runtime";
import { ICommandSuggestion } from "@werckmeister/language-features/features/autocomplete/ICommandSuggestion";

export class AutoComplete {
    constructor(private languageFeatures: LanguageFeatures) {

    }
    
    private createItem(suggestion: ISuggestion, index: number): vscode.CompletionItem {
        const item = new vscode.CompletionItem(suggestion.displayText);
        const OrderOffsetToCompensateLexicographicOrdering = 10000000;
        item.insertText = suggestion.text;
        item.filterText = suggestion.text;
        const markdownString = new vscode.MarkdownString();
        const url = suggestion.url;
        const description = suggestion.description || "";
        const title = url ? `[${suggestion.displayText}](${url})` : suggestion.displayText; 
        const markdownText = `### ${title}
${description}`;
        markdownString.appendMarkdown(markdownText);
        item.documentation = markdownString;
        item.sortText = (index + OrderOffsetToCompensateLexicographicOrdering).toString();
        item.kind = vscode.CompletionItemKind.Value;
        if ((suggestion as IPathSuggestion).file) {
            const pathSuggestion = suggestion as IPathSuggestion;
            item.kind = pathSuggestion.file.isDirectory ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File;
        }
        if ((suggestion as ICommandSuggestion).command) {
            const commandSuggestion = suggestion as ICommandSuggestion;
            item.kind = commandSuggestion.parameter === null ? vscode.CompletionItemKind.Variable : vscode.CompletionItemKind.Value; 
        }
        if (suggestion.deprecated) {
            item.detail = "deprecated: " + suggestion.deprecated;
            (item as any).tags = [1]; // why that hack? how to set properly?
        }
        return item;
    }
    public async complete(document: vscode.TextDocument, position: vscode.Position, 
        token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[]> {
            const doc = new ActiveSourceDocument(document, position);
            try {
                const suggestions = await this.languageFeatures.autoComplete(doc);
                const items = suggestions.map((suggestion, index) => this.createItem(suggestion, index));
                return items;
            } catch(ex) {
                console.error("werckmeister suggestions error", ex);
                return [];
            }
    }
}