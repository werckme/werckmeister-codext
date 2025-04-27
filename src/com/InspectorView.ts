import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState, OnSourcesChanged } from "./Player";
import { AWebView } from './AWebView';
import { WMCommandStop, WMCommandPlay, WMCommandPause, WMCommandOpenDebugger, WMCommandRevalInDebugView } from '../extension';
import { ISheetInfo } from './SheetInfo';
import { Compiler, CompilerMode, unknownSourcePositionValue } from './Compiler';
import { getSheetHistory } from './SheetHistory';
import { getLanguage } from '../language/Language';

const UpdateIfThisExtension:string[] = [
	'.sheet',
	'.template',
	'.conductions',
	'.part'
];

const ViewTitle = "Werckmeister Inspector";
const TitleUpdaterIntervalMillis = 500;

const openedViews:InspectorView[] = [];
function registerInspector(inspector: InspectorView) {
	openedViews.push(inspector);
}
function unregisterInspector(inspector: InspectorView) {
	const idx = openedViews.indexOf(inspector);
	openedViews.splice(idx, 1);
}

interface EventSourceInfo {
	documentPath: string,
	documentSourceId: number,
	eventId: number,
	midiType: number,
	pitchAlias: string,
	sourcePositionBegin:number,
	sourcePositionEnd:number,
	trackId:number
}

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
	private onViewReady: ()=>void = ()=>{};
	private onViewInitialRendered: ()=>void = ()=>{};
	viewReady: Promise<void>;
	viewInitialRendered: Promise<void>;
	titleUpdater: NodeJS.Timeout|null = null;
	constructor(context: vscode.ExtensionContext) {
		super(context);
		registerInspector(this);
		this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
		this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
		this.onSourcesChangedBound = this.onSourcesChanged.bind(this);
		this.viewReady = new Promise(resolve => {
			this.onViewReady = resolve;
		});
		this.viewInitialRendered = new Promise(resolve => {
			this.onViewInitialRendered = resolve;
		})
		if (vscode.window.activeTextEditor) {
			const currentDocumentPath = vscode.window.activeTextEditor.document.fileName;
			this.viewReady.then(async () => {
				const hasErrors = await this.checkForErrors(currentDocumentPath);
				if (!hasErrors) {
					await this.compileAndUpdate(currentDocumentPath);
					this.currentPanel!.webview.postMessage({
						playerState: {newState: PlayerState[getPlayer().state]}
					});
					this.onViewInitialRendered();
				}
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

	private async checkForErrors(sheetPath:string): Promise<boolean> {
		const diagnose = await getLanguage().features.diagnostic.update(sheetPath);
		if (diagnose.hasErrors) {
			const sourcefile = diagnose.errorResult.sourceFile || "unkown location"
			vscode.window.showErrorMessage(` ${sourcefile}: ${diagnose.errorResult.errorMessage}`,'Ok');
			return true;
		}
		return false;
	}

	private async compile(sheetPath:string, mode:CompilerMode = CompilerMode.json): Promise<any> {
		const compiler = new Compiler();
		const result = await compiler.compile(sheetPath, mode);
		let compileResult: any;
		try {
			compileResult = JSON.parse(result);
		} catch (ex){
			vscode.window.showErrorMessage("failed parsing compiler response");
			throw ex;
		}
		return compileResult;
	}

	private async createDebugSymbols(sheetPath:string): Promise<any> {
		const compiler = new Compiler();
		if (await compiler.isDebugSymbolsSupported() === false) {
			return null;
		}
        return this.compile(sheetPath, CompilerMode.debugSymbols);
	}

	private async sendCompileResult(sheetPath: string, compileResult: any) {
		if (!this.currentPanel) {
			return;
		}
		const sheetName = path.basename(sheetPath);
		this.currentPanel.webview.postMessage({compiled: compileResult, sheetPath, sheetName});
	}

	private async sendDebugSymbols(sheetPath: string, debugSymbols: any) {
		if (!this.currentPanel) {
			return;
		}
		this.currentPanel.webview.postMessage({debugSymbols: debugSymbols, sheetPath});
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
			sheetPath = history.lastVisitedSheetFile;
			if (!sheetPath) {
				return;
			}
		}
		const compileResult = await this.compile(sheetPath);
		this.sendCompileResult(sheetPath, compileResult);
		const debugSymbols = await this.createDebugSymbols(sheetPath);
		if (!debugSymbols) {
			return;
		}
		this.sendDebugSymbols(sheetPath, debugSymbols);
	}

	onPlayerStateChanged(state: PlayerState) {
		this.currentPanel!.webview.postMessage({
			playerState: {newState: PlayerState[state]}
		});
		if (state===PlayerState.Playing || state==PlayerState.ConnectedToVst) {
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
			case "goToEventSource": return this.goToEventSource(message.eventInfo);
		}
	}

	private async goToEventSource(eventInfo: EventSourceInfo) {
		if (!eventInfo.documentPath) {
			return;
		}
		const doc = await vscode.workspace.openTextDocument(eventInfo.documentPath);
		const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
		const posBegin = editor.document.positionAt(eventInfo.sourcePositionBegin);
		let sourcePosEnd = eventInfo.sourcePositionEnd;
		if (sourcePosEnd === unknownSourcePositionValue) {
			sourcePosEnd = eventInfo.sourcePositionBegin + 1;
		}
		const posEnd = editor.document.positionAt(sourcePosEnd);
		const range = new vscode.Range(posBegin, posEnd);
		editor.revealRange(range)
		editor.selection = new vscode.Selection(posBegin, posEnd);
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
		unregisterInspector(this);
		super.onPanelDidDispose();
		getPlayer().begin = 0;
		this.removeListener();
	}

	private revealImpl(documentPath: string, positionOffset: number) {
		if(!this.currentPanel) {
			return;
		}
		this.currentPanel.webview.postMessage({
			navigateTo: {
				documentPath,
				positionOffset
			}
		});
	}

	private static async waitUntilInspectorAreAvailable(): Promise<void> {
		let maxTries = 20;
		await new Promise<void>((resolve, reject) => {
			const check = () => {
				if (openedViews.length > 0) {
					resolve();
				}
				if (--maxTries <= 0) {
					reject();
				}
				setTimeout(check, 500);
			};
			check();
		});
		await Promise.all(openedViews.map(x => x.viewInitialRendered));
	}

	public static async reveal(documentPath: string, positionOffset: number):Promise<void> {
		if (openedViews.length === 0) {
			if (path.extname(documentPath) !== '.sheet') {
				vscode.window.showErrorMessage(`you need to open the inspector view of the main sheet first.`);
				return;
			}
			await vscode.commands.executeCommand(WMCommandOpenDebugger);
			await this.waitUntilInspectorAreAvailable();
		}
		for(const inspector of openedViews) {
			inspector.revealImpl(documentPath, positionOffset);
		}
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
				if (player.state === PlayerState.Playing 
					|| player.state === PlayerState.StartPlaying
					|| player.state === PlayerState.ConnectingToVst
					|| player.state === PlayerState.ConnectedToVst) {
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