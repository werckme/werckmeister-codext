"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const Play_1 = require("./commands/Play");
const Stop_1 = require("./commands/Stop");
const ShowSheetView_1 = require("./commands/ShowSheetView");
const ShowPianoView_1 = require("./commands/ShowPianoView");
const Pause_1 = require("./commands/Pause");
const ShowTransportView_1 = require("./commands/ShowTransportView");
const SheetHistory_1 = require("./com/SheetHistory");
const PlayFromPosition_1 = require("./commands/PlayFromPosition");
const Language_1 = require("./language/Language");
function excuteCommand(type, context) {
    let cmd = new type(context);
    cmd.execute();
}
const _ns = "extension.werckmeister";
exports.WMCommandPlay = `${_ns}.play`;
exports.WMCommandStop = `${_ns}.stop`;
exports.WMCommandPause = `${_ns}.pause`;
exports.WMPlayFromPosition = `${_ns}.playFromPosition`;
exports.WMCommandOpenSheeView = `${_ns}.sheetview`;
exports.WMCommandOpenPianoView = `${_ns}.pianoview`;
exports.WMCommandOpenTransportView = `${_ns}.transportview`;
exports.WMDiagnosticCollectionName = "werckmeister";
exports.WMExternalHelpInstallWerckmeisterExtension = "https://werckme.github.io/code-extension";
exports.WMExternalWerckmeisterDownload = "https://werckme.github.io/getting-started";
exports.WMMinimumWerckmeisterCompilerVersion = "0.1.53";
let diagnosticCollection;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let disposable = vscode.commands.registerCommand(exports.WMCommandPlay, excuteCommand.bind(null, Play_1.Play, context));
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
    disposable = vscode.commands.registerCommand(exports.WMPlayFromPosition, excuteCommand.bind(null, PlayFromPosition_1.PlayFromPosition, context));
    context.subscriptions.push(disposable);
    disposable = vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'werckmeister' }, {
        provideCompletionItems: (document, position, token, context) => __awaiter(this, void 0, void 0, function* () {
            const items = yield Language_1.getLanguage().features.autoComplete.complete(document, position, token, context);
            return items;
        }),
    }, ...['/', '_', '=', '"']);
    context.subscriptions.push(disposable);
    diagnosticCollection = vscode.languages.createDiagnosticCollection(exports.WMDiagnosticCollectionName);
    context.subscriptions.push(diagnosticCollection);
    SheetHistory_1.getSheetHistory(); // create singleton
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map