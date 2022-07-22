// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ACommand } from './commands/ACommand';
import { Play } from './commands/Play';
import { PlayTerminal } from './commands/PlayTerminal';
import { Stop } from './commands/Stop';
import { ShowSheetView } from './commands/ShowSheetView';
import { ShowPianoView } from './commands/ShowPianoView';
import { Pause } from './commands/Pause';
import { ShowTransportView } from './commands/ShowTransportView';
import { getSheetHistory } from './com/SheetHistory';
import { PlayFromPosition } from './commands/PlayFromPosition';
import { getLanguage } from './language/Language';
import { ShowInspector } from './commands/ShowInspector';
import { SaveMidi } from './commands/SaveMidi';
import { RevealInDebugView } from './commands/RevealInDebugView';
import { ConnectToVst } from './commands/ConnectToVst';
import { CloseVstConnection } from './commands/CloseVstConnection';
import { getVstConnectionProvider, VstConnectionsProvider } from './com/VstConnectionsProvider';

function excuteCommand(type: (new (context: vscode.ExtensionContext) => ACommand), context: vscode.ExtensionContext, ...args: any[]): void {
	let cmd = new type(context);
	cmd.execute(args);
}
const _ns = "extension.werckmeister";
export const WMCommandPlay = `${_ns}.play`;
export const WMCommandStop = `${_ns}.stop`;
export const WMCommandSaveMidi = `${_ns}.saveMidi`;
export const WMCommandPause = `${_ns}.pause`;
export const WMPlayFromPosition = `${_ns}.playFromPosition`;
export const WMCommandOpenSheeView = `${_ns}.sheetview`;
export const WMCommandOpenPianoView = `${_ns}.pianoview`;
export const WMCommandOpenTransportView = `${_ns}.transportview`;
export const WMCommandOpenDebugger = `${_ns}.inspector`;
export const WMCommandRevalInDebugView = `${_ns}.revealInDebugView`;
export const WMCommandConnectToVst = `${_ns}.connectToVst`; 
export const WMCommandCloseVstConnection = `${_ns}.closeVstConnection`;
export const WMCommandRefreshVstConnections = `${_ns}.refreshVstConnections`;
export const WMDiagnosticCollectionName = "werckmeister";
export const WMExternalHelpInstallWerckmeisterExtension = "https://werckme.github.io/code-extension";
export const WMExternalWerckmeisterDownload = "https://werckme.github.io/getting-started";
export const WMMinimumWerckmeisterCompilerVersion = "0.1.53";
let diagnosticCollection: vscode.DiagnosticCollection;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	let disposable = vscode.commands.registerCommand(WMCommandPlay, excuteCommand.bind(null, Play, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(WMCommandStop, excuteCommand.bind(null, Stop, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(WMCommandPause, excuteCommand.bind(null, Pause, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(WMCommandSaveMidi, excuteCommand.bind(null, SaveMidi, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(WMCommandOpenSheeView, excuteCommand.bind(null, ShowSheetView, context));
	context.subscriptions.push(disposable);	

	disposable = vscode.commands.registerCommand(WMCommandOpenPianoView, excuteCommand.bind(null, ShowPianoView, context));
	context.subscriptions.push(disposable);	
	
	disposable = vscode.commands.registerCommand(WMCommandOpenTransportView, excuteCommand.bind(null, ShowTransportView, context));
	context.subscriptions.push(disposable);	
	
	disposable = vscode.commands.registerCommand(WMCommandOpenDebugger, excuteCommand.bind(null, ShowInspector, context));
	context.subscriptions.push(disposable);	

	disposable = vscode.commands.registerCommand(WMPlayFromPosition, excuteCommand.bind(null, PlayFromPosition, context));
	context.subscriptions.push(disposable);
	
	disposable = vscode.commands.registerCommand(WMCommandRevalInDebugView, excuteCommand.bind(null, RevealInDebugView, context));
	context.subscriptions.push(disposable);	

	disposable = vscode.commands.registerCommand(WMCommandConnectToVst, excuteCommand.bind(null, ConnectToVst, context));
	context.subscriptions.push(disposable);
	
	disposable = vscode.commands.registerCommand(WMCommandCloseVstConnection, excuteCommand.bind(null, CloseVstConnection, context));
	context.subscriptions.push(disposable);
	
	disposable = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'werckmeister' }, {
		provideCompletionItems: async (document: vscode.TextDocument, position: vscode.Position, 
			token: vscode.CancellationToken, context: vscode.CompletionContext) => {
				const items = await getLanguage().features.autoComplete.complete(document, position, token, context);
				return items;
			},
		
	}, ...['/', '_', '=', '"']);
	context.subscriptions.push(disposable);		

	disposable = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'werckmeister' }, {
		provideHover: async (document: vscode.TextDocument, position: vscode.Position, 
			token: vscode.CancellationToken) => {
				return await getLanguage().features.hoverInfo.get(document, position, token);
			},
		
	});

	const vstConnectionProvider = getVstConnectionProvider();

	vscode.window.createTreeView('werckmeister-vstConnections', {
		treeDataProvider: vstConnectionProvider
	});

	disposable = vscode.commands.registerCommand(WMCommandRefreshVstConnections, () => {vstConnectionProvider.refresh()});
	context.subscriptions.push(disposable);
	
	diagnosticCollection = vscode.languages.createDiagnosticCollection(WMDiagnosticCollectionName);
	context.subscriptions.push(diagnosticCollection);


	getSheetHistory(); // create singleton
}

// this method is called when your extension is deactivated
export function deactivate() {}
