import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class SheetView extends ACommand {
	async execute(): Promise<void> {
		const panel = vscode.window.createWebviewPanel(
			'werckmeister.sheetview', // Identifies the type of the webview. Used internally
			'Sheet View', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{} // Webview options. More on these later.
		);
		let onDiskPath = vscode.Uri.file(
			path.join(this.context.extensionPath, 'SheetView', 'SheetView.html')
		);

		fs.readFile(onDiskPath.path, 'utf8', function (err, data) {
			panel.webview.html = data;
		});
	}
}