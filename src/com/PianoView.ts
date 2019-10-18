import * as vscode from 'vscode';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState } from "../com/Player";
import { AWebView } from './AWebView';

export class PianoView extends AWebView {

	currentPanel: vscode.WebviewPanel|null = null;
	onPlayerMessageBound: any;
    onPlayerStateChangedBound: any;
	constructor(context: vscode.ExtensionContext) {
		super(context);
		this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
		this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
	}

	onPlayerStateChanged(state: PlayerState) {
		if (state===PlayerState.Playing) {
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


	onPlayerMessage(message:any) {
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


    protected createPanelImpl(): Promise<vscode.WebviewPanel> {
        return new Promise<vscode.WebviewPanel>((resolve, reject) => {
            this.currentPanel = vscode.window.createWebviewPanel(
                'werckmeister.PianoView', // Identifies the type of the webview. Used internally
                'Piano', // Title of the panel displayed to the user
                vscode.ViewColumn.One, // Editor column to show the new webview panel in.
                {
                    enableScripts: true,
                }
            );
            let jsPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'dist', 'WebViewApp.dist.js'));
            let htmlPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'pianoView.html'));
            
            fs.readFile(htmlPath.path, 'utf8', (err, data) => {
                data = data.replace("$mainSrc", this.toWebViewUri(jsPath))
                this.currentPanel!.webview.html = data;
                resolve(this.currentPanel as vscode.WebviewPanel);
            });

        });
    }
}