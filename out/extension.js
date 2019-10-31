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
const Pause_1 = require("./commands/Pause");
const ShowTransportView_1 = require("./commands/ShowTransportView");
function excuteCommand(type, context) {
    let cmd = new type(context);
    cmd.execute();
}
const _ns = "extension.werckmeister";
exports.WMCommandPlay = `${_ns}.play`;
exports.WMCommandPlayTerminal = `${_ns}.terminal.play`;
exports.WMCommandStop = `${_ns}.stop`;
exports.WMCommandPause = `${_ns}.pause`;
exports.WMCommandOpenSheeView = `${_ns}.sheetview`;
exports.WMCommandOpenPianoView = `${_ns}.pianoview`;
exports.WMCommandOpenTransportView = `${_ns}.transportview`;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let disposable = vscode.commands.registerCommand(exports.WMCommandPlayTerminal, excuteCommand.bind(null, PlayTerminal_1.PlayTerminal, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(exports.WMCommandPlay, excuteCommand.bind(null, Play_1.Play, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(exports.WMCommandStop, excuteCommand.bind(null, Stop_1.Stop, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(exports.WMCommandPause, excuteCommand.bind(null, Pause_1.Pause, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(exports.WMCommandOpenSheeView, excuteCommand.bind(null, ShowSheetView_1.ShowSheetView, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(exports.WMCommandOpenPianoView, excuteCommand.bind(null, ShowPianoView_1.ShowPianoView, context));
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand(exports.WMCommandOpenTransportView, excuteCommand.bind(null, ShowTransportView_1.ShowTransportView, context));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map