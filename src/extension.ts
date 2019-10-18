// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ACommand } from './commands/ACommand';
import { Play } from './commands/Play';
import { PlayTerminal } from './commands/PlayTerminal';
import { Stop } from './commands/Stop';
import { ShowSheetView } from './commands/ShowSheetView';
import { ShowPianoView } from './commands/ShowPianoView';

function excuteCommand(type: (new (context: vscode.ExtensionContext) => ACommand), context: vscode.ExtensionContext): void {
	let cmd = new type(context);
	cmd.execute();

}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let ns = "extension.werckmeister";
	let disposable = vscode.commands.registerCommand(`${ns}.terminal.play`, excuteCommand.bind(null, PlayTerminal, context));
	context.subscriptions.push(disposable);

	
	disposable = vscode.commands.registerCommand(`${ns}.play`, excuteCommand.bind(null, Play, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(`${ns}.stop`, excuteCommand.bind(null, Stop, context));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand(`${ns}.sheetview`, excuteCommand.bind(null, ShowSheetView, context));
	context.subscriptions.push(disposable);	

	disposable = vscode.commands.registerCommand(`${ns}.pianoview`, excuteCommand.bind(null, ShowPianoView, context));
	context.subscriptions.push(disposable);		
}

// this method is called when your extension is deactivated
export function deactivate() {}
