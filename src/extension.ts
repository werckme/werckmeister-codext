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

function excuteCommand(type: (new (context: vscode.ExtensionContext) => ACommand), context: vscode.ExtensionContext): void {
	let cmd = new type(context);
	cmd.execute();
}
const _ns = "extension.werckmeister";
export const WMCommandPlay = `${_ns}.play`;
export const WMCommandStop = `${_ns}.stop`;
export const WMCommandPause = `${_ns}.pause`;
export const WMPlayFromPosition = `${_ns}.playFromPosition`;
export const WMCommandOpenSheeView = `${_ns}.sheetview`;
export const WMCommandOpenPianoView = `${_ns}.pianoview`;
export const WMCommandOpenTransportView = `${_ns}.transportview`;
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

	disposable = vscode.commands.registerCommand(WMCommandOpenSheeView, excuteCommand.bind(null, ShowSheetView, context));
	context.subscriptions.push(disposable);	

	disposable = vscode.commands.registerCommand(WMCommandOpenPianoView, excuteCommand.bind(null, ShowPianoView, context));
	context.subscriptions.push(disposable);	
	
	disposable = vscode.commands.registerCommand(WMCommandOpenTransportView, excuteCommand.bind(null, ShowTransportView, context));
	context.subscriptions.push(disposable);		

	disposable = vscode.commands.registerCommand(WMPlayFromPosition, excuteCommand.bind(null, PlayFromPosition, context));
	context.subscriptions.push(disposable);		
	
	disposable = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'werckmeister' }, {
		provideCompletionItems: async (document: vscode.TextDocument, position: vscode.Position, 
			token: vscode.CancellationToken, context: vscode.CompletionContext) => {
				const items = await getLanguage().features.autoComplete.complete(document, position, token, context);
				return items;
			},
		
	}, ...['/', '_', '=', '"']);
	context.subscriptions.push(disposable);		
	
	diagnosticCollection = vscode.languages.createDiagnosticCollection(WMDiagnosticCollectionName);
	context.subscriptions.push(diagnosticCollection);


	getSheetHistory(); // create singleton
}

// this method is called when your extension is deactivated
export function deactivate() {}
