"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const Play_1 = require("./commands/Play");
const PlayTerminal_1 = require("./commands/PlayTerminal");
const Stop_1 = require("./commands/Stop");
const ShowSheetView_1 = require("./commands/ShowSheetView");
const ShowPianoView_1 = require("./commands/ShowPianoView");
function excuteCommand(type, context) {
    let cmd = new type(context);
    cmd.execute();
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let ns = "extension.werckmeister";
    let disposable = vscode.commands.registerCommand(`${ns}.terminal.play`, excuteCommand.bind(null, PlayTerminal_1.PlayTerminal, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`${ns}.play`, excuteCommand.bind(null, Play_1.Play, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`${ns}.stop`, excuteCommand.bind(null, Stop_1.Stop, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`${ns}.sheetview`, excuteCommand.bind(null, ShowSheetView_1.ShowSheetView, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(`${ns}.pianoview`, excuteCommand.bind(null, ShowPianoView_1.ShowPianoView, context));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map