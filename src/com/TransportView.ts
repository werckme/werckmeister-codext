import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState, OnSourcesChanged } from "../com/Player";
import { AWebView } from './AWebView';
import { WMCommandStop, WMCommandPlay, WMCommandPause } from '../extension';
import { ISheetInfo } from './SheetInfo';

const ViewTitle = "Sheet Monitor (stopped)";
const TitleUpdaterIntervalMillis = 500;
export class TransportView extends AWebView {
	currentPanel: vscode.WebviewPanel|null = null;
	get panel():  vscode.WebviewPanel|null {
		return this.currentPanel;
	}
	onPlayerMessageBound: any;
	onPlayerStateChangedBound: any;
	onSourcesChangedBound: any;
	sheetInfo: ISheetInfo|null = null;
	onViewReady: ()=>void = ()=>{};
	viewReady: Promise<void>;
	titleUpdater: NodeJS.Timeout|null = null;
	constructor(context: vscode.ExtensionContext) {
		super(context);
		this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
		this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
		this.onSourcesChangedBound = this.onSourcesChanged.bind(this);
		this.viewReady = new Promise(resolve => {
			this.onViewReady = resolve;
		});
	}

	startTitleUpdater() {
		if (this.titleUpdater) {
			return;
		}
		this.titleUpdater = setInterval(this.updatePlayingTitle.bind(this), TitleUpdaterIntervalMillis);
	}

	stopTitleUpdater() {
		if (this.titleUpdater !== null) {
			clearInterval(this.titleUpdater);
			this.titleUpdater = null;
		}
	}

	async onSourcesChanged() {
		if (!this.currentPanel) {
			return;
		}
		const message = await this.updateSheetSourceMap();
		this.currentPanel.webview.postMessage(message);
	}

	onPlayerStateChanged(state: PlayerState) {
		this.currentPanel!.webview.postMessage({
			playerState: {newState: PlayerState[state]}
		});
		if (state===PlayerState.Playing) {
			this.updateSheetSourceMapAndSend();
			this.startTitleUpdater();
			
		}
		if (state===PlayerState.Stopped) {
			this.currentPanel!.title = ViewTitle;
			this.stopTitleUpdater();
		}
	}

	updatePlayingTitle() {
		if (!this.currentPanel) {
			return;
		}
		const player = getPlayer();
		if (player.sheetTime) {
			const time = (player.sheetTime as number).toFixed(1);
			this.currentPanel!.title = `▶ ${time}`;
		}
	}

	onPlayerMessage(message:any) {
		if (!this.currentPanel) {
			return;
		}
		this.currentPanel.webview.postMessage(message);
	}

	async updateSheetSourceMap(): Promise<any> {
		if (!this.currentPanel) {
			return;
		}
		let player:Player = getPlayer();
		this.sheetInfo = player.sheetInfo;
		if (!this.sheetInfo) {
			return;
		}
		return {duration: this.sheetInfo!.duration};
	}

	registerListener() {
		let player:Player = getPlayer();
		player.playerMessage.on(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.on(OnPlayerStateChanged, this.onPlayerStateChangedBound);
		player.playerMessage.on(OnSourcesChanged, this.onSourcesChangedBound);
	}

	removeListener() {
		let player:Player = getPlayer();
		player.playerMessage.removeListener(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.removeListener(OnPlayerStateChanged, this.onPlayerStateChangedBound);
		player.playerMessage.removeListener(OnSourcesChanged, this.onSourcesChangedBound);
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
			case "transportview-ready": return this.onViewReady();
		}
	}

	onWebViewStateChanged(ev:vscode.WebviewPanelOnDidChangeViewStateEvent) {
	}

	async updateSheetSourceMapAndSend() {
		if (this.currentPanel === null) {
			return;
		}
		const message = await this.updateSheetSourceMap();
		this.currentPanel.webview.postMessage(message);
	}

	onPanelDidDispose() {
		super.onPanelDidDispose();
		getPlayer().begin = 0;
	}

    protected createPanelImpl(): Promise<vscode.WebviewPanel> {
        return new Promise<vscode.WebviewPanel>((resolve, reject) => {
            this.currentPanel = vscode.window.createWebviewPanel(
                'werckmeister.TransportView', // Identifies the type of the webview. Used internally
                ViewTitle, // Title of the panel displayed to the user
                vscode.ViewColumn.Active, // Editor column to show the new webview panel in.
                {
					enableScripts: true,
					retainContextWhenHidden: true
                }
			);
            let jsPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'dist', 'WebViewApp.dist.js'));
            let htmlPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'transportView.html'));

			this.currentPanel.webview.onDidReceiveMessage(this.onWebViewMessage.bind(this), undefined, this.context.subscriptions);
			this.currentPanel.onDidChangeViewState(this.onWebViewStateChanged.bind(this));
			this.viewReady.then(()=>{
				const player = getPlayer();
				if (player.state === PlayerState.Playing || player.state === PlayerState.StartPlaying) {
					this.startTitleUpdater();
				}
				this.updateSheetSourceMapAndSend();
			});

            fs.readFile(htmlPath.fsPath, 'utf8', (err, data) => {
                data = data.replace("$mainSrc", this.toWebViewUri(jsPath))
                this.currentPanel!.webview.html = data;
                resolve(this.currentPanel as vscode.WebviewPanel);
            });

        });
    }
}