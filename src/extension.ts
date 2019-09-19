// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ACommand } from './commands/ACommand';
import { Play } from './commands/Play';
import { PlayTerminal } from './commands/PlayTerminal';
import { Stop } from './commands/Stop';

function excuteCommand(type: (new () => ACommand)): void {
	let cmd = new type();
	cmd.execute();

}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let ns = "extension.werckmeister";
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(`${ns}.terminal.play`, excuteCommand.bind(null, PlayTerminal));
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand(`${ns}.play`, excuteCommand.bind(null, Play));
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand(`${ns}.stop`, excuteCommand.bind(null, Stop));
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
