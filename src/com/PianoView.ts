import * as vscode from 'vscode';
import * as fs from 'fs';
import { AWebView } from './AWebView';
import { getSheetHistory } from './SheetHistory';

export class PianoView extends AWebView {
	currentPanel: vscode.WebviewPanel|null = null;
	get panel():  vscode.WebviewPanel|null {
		return this.currentPanel;
	}
	constructor(context: vscode.ExtensionContext) {
		super(context);
	}

	async onText(textMessage: {text: string}) {
		 const sheetHistory = getSheetHistory();
		 const lastSheetFile = sheetHistory.lastVisitedSheetFile;
		 if (!lastSheetFile) {
			vscode.window.showWarningMessage("no active sheet document found");
			return;
		 }
		 const uri = vscode.Uri.file(lastSheetFile);
		 const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === uri.fsPath);
		 if (!editor) {
			vscode.window.showWarningMessage("no active sheet edtor found");
			return;
		 }
		 const position = editor.selection.active;
		 editor.edit(editBuilder => {
    		editBuilder.insert(position, textMessage.text);
		});
	}

	onWebViewMessage(message: any) {
		switch(message.command) {
			case "send-text": this.onText(message)
		}
	}

    protected createPanelImpl(): Promise<vscode.WebviewPanel> {
        return new Promise<vscode.WebviewPanel>((resolve, reject) => {
            this.currentPanel = vscode.window.createWebviewPanel(
                'werckmeister.PianoView', // Identifies the type of the webview. Used internally
                'Piano', // Title of the panel displayed to the user
                vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
                {
                    enableScripts: true,
                }
            );
			this.currentPanel.webview.onDidReceiveMessage(this.onWebViewMessage.bind(this), undefined, this.context.subscriptions);
            let jsPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'dist', 'WebViewApp.dist.js'));
            let htmlPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'pianoView.html'));
            
            fs.readFile(htmlPath.fsPath, 'utf8', (err, data) => {
                data = data.replace("$mainSrc", this.toWebViewUri(jsPath))
                this.currentPanel!.webview.html = data;
                resolve(this.currentPanel as vscode.WebviewPanel);
            });

        });
    }
}