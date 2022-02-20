import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState, OnSourcesChanged } from "./Player";
import { AWebView } from './AWebView';
import { WMCommandStop, WMCommandPlay, WMCommandPause } from '../extension';
import { ISheetInfo } from './SheetInfo';
import { Compiler, CompilerMode } from './Compiler';
import { getSheetHistory } from './SheetHistory';

const UpdateIfThisExtension:string[] = [
	'.sheet',
	'.template',
	'.conductions'
];

const ViewTitle = "Werckmeister Inspector";
const TitleUpdaterIntervalMillis = 500;
export class InspectorView extends AWebView {
	currentPanel: vscode.WebviewPanel|null = null;
	get panel():  vscode.WebviewPanel|null {
		return this.currentPanel;
	}
	onPlayerMessageBound: any;
	onPlayerStateChangedBound: any;
	onSourcesChangedBound: any;
	onDidDocumentSaveDisposable: vscode.Disposable|null= null;
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
		if (vscode.window.activeTextEditor) {
			const currentDocumentPath = vscode.window.activeTextEditor.document.fileName;
			this.viewReady.then(() => {
				this.compileAndUpdate(currentDocumentPath);
				this.currentPanel!.webview.postMessage({
					playerState: {newState: PlayerState[getPlayer().state]}
				});
			})
		}
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

	private async compile(sheetPath:string): Promise<any> {
		const compiler = new Compiler();
        const result = await compiler.compile(sheetPath, CompilerMode.json);
		let compileResult: any;
		try {
			compileResult = JSON.parse(result);
		} catch {
			vscode.window.showErrorMessage("failed parsing compiler response");
		}
		return compileResult;
	}

	private async sendCompileResult(sheetPath: string, compileResult: any) {
		if (!this.currentPanel) {
			return;
		}
		const sheetName = path.basename(sheetPath);
		this.currentPanel.webview.postMessage({compiled: compileResult, sheetPath, sheetName});
	}


	async compileAndUpdate(sheetPath: string|undefined) {
		if (!sheetPath) {
			return;
		}
		const fileExt = path.extname(sheetPath);
		if (UpdateIfThisExtension.includes(fileExt) === false) {
			return;
		}
		if (fileExt !== '.sheet') {
			const history = getSheetHistory();
			sheetPath = history.lastEditedSheetFile;
			if (!sheetPath) {
				return;
			}
		}
		const compileResult = await this.compile(sheetPath);
		this.sendCompileResult(sheetPath, compileResult);
	}

	onPlayerStateChanged(state: PlayerState) {
		this.currentPanel!.webview.postMessage({
			playerState: {newState: PlayerState[state]}
		});
		if (state===PlayerState.Playing) {
			this.updateSheetSourceMapAndSend();
			const player = getPlayer();
			this.compileAndUpdate(player.currentFile!);
		}
		if (state===PlayerState.Stopped) {
			this.currentPanel!.title = ViewTitle;
		}
	}

	updatePlayingTitle() {
		if (!this.currentPanel) {
			return;
		}
		const player = getPlayer();
		if (player.sheetTime) {
			const time = (player.sheetTime as number).toFixed(1);
			this.currentPanel!.title = `${ViewTitle} ${time}`;
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

	onDocumentSaved(document: vscode.TextDocument) {
		this.compileAndUpdate(document.fileName);
	}

	registerListener() {
		let player:Player = getPlayer();
		player.playerMessage.on(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.on(OnPlayerStateChanged, this.onPlayerStateChangedBound);
		player.playerMessage.on(OnSourcesChanged, this.onSourcesChangedBound);
		this.onDidDocumentSaveDisposable = vscode.workspace.onDidSaveTextDocument(this.onDocumentSaved.bind(this));
	}

	removeListener() {
		let player:Player = getPlayer();
		player.playerMessage.removeListener(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.removeListener(OnPlayerStateChanged, this.onPlayerStateChangedBound);
		player.playerMessage.removeListener(OnSourcesChanged, this.onSourcesChangedBound);
		if (this.onDidDocumentSaveDisposable) {
			this.onDidDocumentSaveDisposable.dispose();
		}
	}

	onStopReceived() {
		vscode.commands.executeCommand(WMCommandStop);
	}

	onPlayReceived(begin: number = 0) {
		getPlayer().begin = begin || 0;
		vscode.commands.executeCommand(WMCommandPlay);
	}

	onPauseReceived() {
		vscode.commands.executeCommand(WMCommandPause);
	}

	onWebViewMessage(message: any) {
		console.log(message);
		switch(message.command) {
			case "player-stop": return this.onStopReceived();
			case "player-play": return this.onPlayReceived(message.begin);
			case "player-pause": return this.onPauseReceived();
			case "debuggerview-ready": return this.onViewReady();
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
		this.removeListener();
	}

    protected createPanelImpl(): Promise<vscode.WebviewPanel> {
        return new Promise<vscode.WebviewPanel>((resolve, reject) => {
            this.currentPanel = vscode.window.createWebviewPanel(
                'werckmeister.Inspector', // Identifies the type of the webview. Used internally
                ViewTitle, // Title of the panel displayed to the user
                vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
                {
					enableScripts: true,
					retainContextWhenHidden: true,
                }
			);
            let jsPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'dist', 'WebViewApp.dist.js'));
            let htmlPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'inspector.html'));

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