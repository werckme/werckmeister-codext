"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const Play_1 = require("./commands/Play");
const PlayTerminal_1 = require("./commands/PlayTerminal");
const Stop_1 = require("./commands/Stop");
function excuteCommand(type) {
    let cmd = new type();
    cmd.execute();
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let ns = "extension.werckmeister";
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(`${ns}.terminal.play`, excuteCommand.bind(null, PlayTerminal_1.PlayTerminal));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`${ns}.play`, excuteCommand.bind(null, Play_1.Play));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`${ns}.stop`, excuteCommand.bind(null, Stop_1.Stop));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map