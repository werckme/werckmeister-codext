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
const ACommand_1 = require("./ACommand");
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const Player_1 = require("../com/Player");
let currentSheetView = null;
class SheetView extends ACommand_1.ACommand {
    constructor(context) {
        super(context);
        this.currentPanel = null;
        this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
    }
    toWebViewUri(uri) {
        // panel.webview.asWebviewUri is not available at runtime for some reason
        return `vscode-resource:${uri.path}`;
    }
    onPlayerMessage(message) {
        if (!this.currentPanel) {
            return;
        }
        this.currentPanel.webview.postMessage(message);
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (currentSheetView !== null) {
                return;
            }
            this.currentPanel = vscode.window.createWebviewPanel('werckmeister.sheetview', // Identifies the type of the webview. Used internally
            'Sheet View', // Title of the panel displayed to the user
            vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
            });
            currentSheetView = this;
            let jsPath = vscode.Uri.file(path.join(this.context.extensionPath, 'SheetView', 'dist', 'sheetView.dist.js'));
            let htmlPath = vscode.Uri.file(path.join(this.context.extensionPath, 'SheetView', 'SheetView.html'));
            fs.readFile(htmlPath.path, 'utf8', (err, data) => {
                data = data.replace("$mainSrc", this.toWebViewUri(jsPath));
                this.currentPanel.webview.html = data;
            });
            let player = Player_1.getPlayer();
            player.onPlayerMessage.on(Player_1.OnPlayerMessageEvent, this.onPlayerMessageBound);
            this.currentPanel.onDidDispose(() => {
                player.onPlayerMessage.removeListener(Player_1.OnPlayerMessageEvent, this.onPlayerMessageBound);
                currentSheetView = null;
            });
        });
    }
}
exports.SheetView = SheetView;
//# sourceMappingURL=SheetView.js.map