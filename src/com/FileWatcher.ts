import * as vscode from 'vscode';
import { getLanguage } from '../language/Language';

export class FileWatcher extends vscode.Disposable {
    onDidDocumentSaveDisposable: vscode.Disposable;
    constructor() {
        super(() => {
            this.doDispose();
        });
        this.onDidDocumentSaveDisposable = vscode.workspace.onDidSaveTextDocument(this.checkCurrentSheetForErrors.bind(this));
    }

    private doDispose() {
        if (this.onDidDocumentSaveDisposable) {
            this.onDidDocumentSaveDisposable.dispose();
        }
    }

    private async checkCurrentSheetForErrors(doc: vscode.TextDocument): Promise<void> {
        try {
            const diagnose = await getLanguage().features.diagnostic.update(doc.uri.fsPath);
        } catch (ex) {
            vscode.window.showErrorMessage(` ${doc.uri.fsPath}: ${ex}`,'Ok');
        }
    }
}