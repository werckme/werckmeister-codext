import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState } from "../com/Player";


let currentSheetView: any = null;

export class SheetView extends ACommand {

	currentPanel: vscode.WebviewPanel|null = null;
	onPlayerMessageBound: any;
	onSheetFileChangedeBound: any;
	constructor(context: vscode.ExtensionContext) {
		super(context);
		this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
		this.onSheetFileChangedeBound = this.onSheetFileChanged.bind(this);
	}

	toWebViewUri(uri: vscode.Uri): string {
		// panel.webview.asWebviewUri is not available at runtime for some reason
		return `vscode-resource:${uri.path}`;
	}

	onSheetFileChanged(state: PlayerState) {
		if (state===PlayerState.Playing) {
			this.updateSheetSourceMap();
		}
	}

	readFile(path:string):Promise<string> {
		return new Promise((resolve, reject) => {
			fs.readFile(path, "utf8", (err, data) => {
				if (!!err) {
					reject(err);
					return;
				}
				resolve(data);
			});
		});
	}

	async updateSheetSourceMap() {
		if (!this.currentPanel) {
			return;
		}	
		let player:Player = getPlayer();
		let sourceMap = player.sourceMap;
		let fileInfos = sourceMap!.sources.map(async (source)=>{
			const fileInfo:any = {};
			Object.assign(fileInfo, source);
			fileInfo.extension = path.extname(source.path);
			fileInfo.basename = path.basename(source.path);
			fileInfo.text = await this.readFile(source.path);
			return fileInfo;
		});

		
		fileInfos = await Promise.all(fileInfos);
		this.currentPanel.webview.postMessage({fileInfos});
	}

	onPlayerMessage(message:any) {
		if (!this.currentPanel) {
			return;
		}
		this.currentPanel.webview.postMessage(message);
	}

	registerListener() {
		let player:Player = getPlayer();
		player.playerMessage.on(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.on(OnPlayerStateChanged, this.onSheetFileChangedeBound);
	}

	removeListener() {
		let player:Player = getPlayer();
		player.playerMessage.removeListener(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.removeListener(OnPlayerStateChanged, this.onSheetFileChangedeBound);
	}

	async execute(): Promise<void> {
		if (currentSheetView !== null) {
			return;
		}
		this.currentPanel = vscode.window.createWebviewPanel(
			'werckmeister.sheetview', // Identifies the type of the webview. Used internally
			'Sheet View', // Title of the panel displayed to the user
			vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
			{
				enableScripts: true,
			}
		);
		currentSheetView = this;
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

		this.registerListener();

		this.currentPanel.onDidDispose(()=>{
			this.removeListener();
			currentSheetView = null;
		});
	}
}