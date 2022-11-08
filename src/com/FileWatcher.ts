import * as vscode from 'vscode';
import { getLanguage } from '../language/Language';
import { getSheetHistory } from './SheetHistory';

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
            const sheetHistory = getSheetHistory();
            let sheetpath = sheetHistory.currentFile;
            if (!sheetpath) {
                sheetpath = sheetHistory.lastPlayedSheetFile;
            }
            if (!sheetpath) {
                sheetpath = sheetHistory.lastVisitedSheetFile;
            }
            if (!sheetpath) {
                return;
            }
            const diagnose = await getLanguage().features.diagnostic.update(sheetpath);
        } catch (ex) {
            vscode.window.showErrorMessage(` ${doc.uri.fsPath}: ${ex}`,'Ok');
        }
    }
}