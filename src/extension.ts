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

function excuteCommand(type: (new (context: vscode.ExtensionContext) => ACommand), context: vscode.ExtensionContext): void {
	let cmd = new type(context);
	cmd.execute();

}
const _ns = "extension.werckmeister";
export const WMCommandPlay = `${_ns}.play`;
export const WMCommandPlayTerminal = `${_ns}.terminal.play`;
export const WMCommandStop = `${_ns}.stop`;
export const WMCommandPause = `${_ns}.pause`;
export const WMCommandOpenSheeView = `${_ns}.sheetview`;
export const WMCommandOpenPianoView = `${_ns}.pianoview`;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	let disposable = vscode.commands.registerCommand(WMCommandPlayTerminal, excuteCommand.bind(null, PlayTerminal, context));
	context.subscriptions.push(disposable);

	
	disposable = vscode.commands.registerCommand(WMCommandPlay, excuteCommand.bind(null, Play, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(WMCommandStop, excuteCommand.bind(null, Stop, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(WMCommandPause, excuteCommand.bind(null, Pause, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(WMCommandOpenSheeView, excuteCommand.bind(null, ShowSheetView, context));
	context.subscriptions.push(disposable);	

	disposable = vscode.commands.registerCommand(WMCommandOpenPianoView, excuteCommand.bind(null, ShowPianoView, context));
	context.subscriptions.push(disposable);		
}

// this method is called when your extension is deactivated
export function deactivate() {}
