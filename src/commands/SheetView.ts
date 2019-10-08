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
			{
				enableScripts: true,
			}
		);


		let jsPath = vscode.Uri.file(
			path.join(this.context.extensionPath, 'SheetView', 'dist', 'sheetView.dist.js')
		);

		let htmlPath = vscode.Uri.file(
			path.join(this.context.extensionPath, 'SheetView', 'SheetView.html')
		);
		
		console.log(jsPath);
		fs.readFile(htmlPath.path, 'utf8', function (err, data) {
			data = data.replace("$mainSrc", `vscode-resource:${jsPath.path}`)
			panel.webview.html = data;
		});
	}
}