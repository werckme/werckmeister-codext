import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState } from "../com/Player";
import { AWebView } from './AWebView';
import { WMCommandStop, WMCommandPlay, WMCommandPause } from '../extension';

export class SheetView extends AWebView {

	currentPanel: vscode.WebviewPanel|null = null;
	onPlayerMessageBound: any;
    onPlayerStateChangedBound: any;
	constructor(context: vscode.ExtensionContext) {
		super(context);
		this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
		this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
	}

	onPlayerStateChanged(state: PlayerState) {
		this.currentPanel!.webview.postMessage({
			playerState: {newState: PlayerState[state]}
		});
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
		let sheetInfo = player.sheetInfo;
		let fileInfos = sheetInfo!.sources.map(async (source)=>{
			const fileInfo:any = {};
			Object.assign(fileInfo, source);
			fileInfo.extension = path.extname(source.path);
			fileInfo.basename = path.basename(source.path);
			fileInfo.text = await this.readFile(source.path);
			return fileInfo;
		});
		fileInfos = await Promise.all(fileInfos);
		this.currentPanel.webview.postMessage({fileInfos, duration: sheetInfo!.duration});
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
		player.playerMessage.on(OnPlayerStateChanged, this.onPlayerStateChangedBound);
	}

	removeListener() {
		let player:Player = getPlayer();
		player.playerMessage.removeListener(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.removeListener(OnPlayerStateChanged, this.onPlayerStateChangedBound);
	}

	onStopReceived() {
		vscode.commands.executeCommand(WMCommandStop);
	}

	onPlayReceived() {
		vscode.commands.executeCommand(WMCommandPlay);
	}

	onPauseReceived() {
		vscode.commands.executeCommand(WMCommandPause);
	}

	onRangeChanged(begin: number) {
		getPlayer().begin = begin;
	}

	onWebViewMessage(message: any) {
		switch(message.command) {
			case "player-stop": return this.onStopReceived();
			case "player-play": return this.onPlayReceived();
			case "player-pause": return this.onPauseReceived();
			case "player-update-range": return this.onRangeChanged(message.begin);
		}
	}

    protected createPanelImpl(): Promise<vscode.WebviewPanel> {
        return new Promise<vscode.WebviewPanel>((resolve, reject) => {
            this.currentPanel = vscode.window.createWebviewPanel(
                'werckmeister.SheetView', // Identifies the type of the webview. Used internally
                'Sheet', // Title of the panel displayed to the user
                vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
                {
                    enableScripts: true,
                }
            );
            let jsPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'dist', 'WebViewApp.dist.js'));
            let htmlPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'sheetView.html'));
			
			this.currentPanel.webview.onDidReceiveMessage(this.onWebViewMessage.bind(this), undefined, this.context.subscriptions);
			
            fs.readFile(htmlPath.fsPath, 'utf8', (err, data) => {
                data = data.replace("$mainSrc", this.toWebViewUri(jsPath))
                this.currentPanel!.webview.html = data;
                resolve(this.currentPanel as vscode.WebviewPanel);
            });

        });
    }
}