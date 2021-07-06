import * as vscode from 'vscode';

import { Cursor, IActiveSourceDocument, ISourceDocument } from "@werckmeister/language-features";

export class SourceDocument implements ISourceDocument {
    constructor(protected document: vscode.TextDocument) {
    }
    public async getRange(from: Cursor, to: Cursor): Promise<string> {
        const range = new vscode.Range(
            new vscode.Position(from.line, from.col),
            new vscode.Position(to.line, to.col)
        )
        const text = this.document.getText(range);
        return text;
    }
    public async getLine(lineNr: number): Promise<string> {
        const line = this.document.lineAt(lineNr);
        return line.text;
    }
    public async getAbsolutePath(): Promise<string> {
        const file = this.document.uri.fsPath;
        return file;
    }
}

export class ActiveSourceDocument extends SourceDocument implements IActiveSourceDocument {
    constructor(document: vscode.TextDocument, private position: vscode.Position) {
        super(document);
    }
    public async getCursor(): Promise<Cursor> {
       return {
           line: this.position.line,
           col: this.position.character
       };
    }
}