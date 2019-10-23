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
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const Player_1 = require("../com/Player");
const AWebView_1 = require("./AWebView");
const extension_1 = require("../extension");
class SheetView extends AWebView_1.AWebView {
    constructor(context) {
        super(context);
        this.currentPanel = null;
        this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
        this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
    }
    onPlayerStateChanged(state) {
        this.currentPanel.webview.postMessage({
            playerState: { newState: Player_1.PlayerState[state] }
        });
        if (state === Player_1.PlayerState.Playing) {
            this.updateSheetSourceMap();
        }
    }
    readFile(path) {
        return new Promise((resolve, reject) => {
            fs.readFile(path, "utf8", (err, data) => {
                if (!!err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    }
    updateSheetSourceMap() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentPanel) {
                return;
            }
            let player = Player_1.getPlayer();
            let sourceMap = player.sourceMap;
            let fileInfos = sourceMap.sources.map((source) => __awaiter(this, void 0, void 0, function* () {
                const fileInfo = {};
                Object.assign(fileInfo, source);
                fileInfo.extension = path.extname(source.path);
                fileInfo.basename = path.basename(source.path);
                fileInfo.text = yield this.readFile(source.path);
                return fileInfo;
            }));
            fileInfos = yield Promise.all(fileInfos);
            this.currentPanel.webview.postMessage({ fileInfos });
        });
    }
    onPlayerMessage(message) {
        if (!this.currentPanel) {
            return;
        }
        this.currentPanel.webview.postMessage(message);
    }
    registerListener() {
        let player = Player_1.getPlayer();
        player.playerMessage.on(Player_1.OnPlayerMessageEvent, this.onPlayerMessageBound);
        player.playerMessage.on(Player_1.OnPlayerStateChanged, this.onPlayerStateChangedBound);
    }
    removeListener() {
        let player = Player_1.getPlayer();
        player.playerMessage.removeListener(Player_1.OnPlayerMessageEvent, this.onPlayerMessageBound);
        player.playerMessage.removeListener(Player_1.OnPlayerStateChanged, this.onPlayerStateChangedBound);
    }
    onStopReceived() {
        vscode.commands.executeCommand(extension_1.WMCommandStop);
    }
    onPlayReceived() {
        vscode.commands.executeCommand(extension_1.WMCommandPlay);
    }
    onPauseReceived() {
        vscode.commands.executeCommand(extension_1.WMCommandPause);
    }
    onWebViewMessage(message) {
        switch (message.command) {
            case "player-stop": return this.onStopReceived();
            case "player-play": return this.onPlayReceived();
            case "player-pause": return this.onPauseReceived();
        }
    }
    createPanelImpl() {
        return new Promise((resolve, reject) => {
            this.currentPanel = vscode.window.createWebviewPanel('werckmeister.SheetView', // Identifies the type of the webview. Used internally
            'Sheet', // Title of the panel displayed to the user
            vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
            });
            let jsPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'dist', 'WebViewApp.dist.js'));
            let htmlPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'sheetView.html'));
            this.currentPanel.webview.onDidReceiveMessage(this.onWebViewMessage.bind(this), undefined, this.context.subscriptions);
            fs.readFile(htmlPath.fsPath, 'utf8', (err, data) => {
                data = data.replace("$mainSrc", this.toWebViewUri(jsPath));
                this.currentPanel.webview.html = data;
                resolve(this.currentPanel);
            });
        });
    }
}
exports.SheetView = SheetView;
//# sourceMappingURL=SheetView.js.map