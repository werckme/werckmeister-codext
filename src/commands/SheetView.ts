import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent } from "../com/Player";

export class SheetView extends ACommand {

	currentPanel: vscode.WebviewPanel|null = null;
	onPlayerMessageBound: any;
	constructor(context: vscode.ExtensionContext) {
		super(context);
		this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
	}

	toWebViewUri(uri: vscode.Uri): string {
		// panel.webview.asWebviewUri is not available at runtime for some reason
		return `vscode-resource:${uri.path}`;
	}

	onPlayerMessage(sheetTime:Number) {
		if (!this.currentPanel) {
			return;
		}
		this.currentPanel.webview.postMessage({sheetTime: sheetTime});
	}

	async execute(): Promise<void> {
		this.currentPanel = vscode.window.createWebviewPanel(
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
		
		fs.readFile(htmlPath.path, 'utf8', (err, data) => {
			data = data.replace("$mainSrc", this.toWebViewUri(jsPath))
			this.currentPanel!.webview.html = data;
		});

		let player:Player = getPlayer();
		player.onPlayerMessage.on(OnPlayerMessageEvent, this.onPlayerMessageBound);

		this.currentPanel.onDidDispose(()=>{
			player.onPlayerMessage.removeListener(OnPlayerMessageEvent, this.onPlayerMessageBound);
		});
	}
}