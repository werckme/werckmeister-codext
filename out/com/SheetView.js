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
const ViewTitle = "Sheet Monitor (stopped)";
const TitleUpdaterIntervalMillis = 500;
class SheetView extends AWebView_1.AWebView {
    constructor(context) {
        super(context);
        this.currentPanel = null;
        this.sheetInfo = null;
        this.onSheetViewReady = () => { };
        this.titleUpdater = null;
        this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
        this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
        this.onSourcesChangedBound = this.onSourcesChanged.bind(this);
        this.sheetViewReady = new Promise(resolve => {
            this.onSheetViewReady = resolve;
        });
    }
    get panel() {
        return this.currentPanel;
    }
    startTitleUpdater() {
        if (this.titleUpdater) {
            return;
        }
        this.titleUpdater = setInterval(this.updatePlayingTitle.bind(this), TitleUpdaterIntervalMillis);
    }
    stopTitleUpdater() {
        if (this.titleUpdater !== null) {
            clearInterval(this.titleUpdater);
            this.titleUpdater = null;
        }
    }
    onPlayerStateChanged(state) {
        this.currentPanel.webview.postMessage({
            playerState: { newState: Player_1.PlayerState[state] }
        });
        if (state === Player_1.PlayerState.Playing) {
            this.updateSheetSourceMapAndSend();
            this.startTitleUpdater();
        }
        if (state === Player_1.PlayerState.Stopped) {
            this.currentPanel.title = ViewTitle;
            this.stopTitleUpdater();
        }
    }
    updatePlayingTitle() {
        if (!this.currentPanel) {
            return;
        }
        const player = Player_1.getPlayer();
        if (player.sheetTime) {
            const time = player.sheetTime.toFixed(1);
            this.currentPanel.title = `▶ ${time}`;
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
    updateSheetSourceMapAndSend() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentPanel === null) {
                return;
            }
            const message = yield this.updateSheetSourceMap();
            this.currentPanel.webview.postMessage(message);
        });
    }
    updateSheetSourceMap() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentPanel) {
                return;
            }
            let player = Player_1.getPlayer();
            this.sheetInfo = player.sheetInfo;
            if (!this.sheetInfo) {
                return;
            }
            let fileInfos = this.sheetInfo.sources.map((source) => __awaiter(this, void 0, void 0, function* () {
                const fileInfo = {};
                Object.assign(fileInfo, source);
                fileInfo.extension = path.extname(source.path);
                fileInfo.basename = path.basename(source.path);
                fileInfo.text = yield this.readFile(source.path);
                return fileInfo;
            }));
            fileInfos = yield Promise.all(fileInfos);
            return { fileInfos, duration: this.sheetInfo.duration };
        });
    }
    onPlayerMessage(message) {
        if (!this.currentPanel) {
            return;
        }
        this.currentPanel.webview.postMessage(message);
    }
    onSourcesChanged() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentPanel) {
                return;
            }
            const message = yield this.updateSheetSourceMap();
            message.sourcesChanged = true;
            this.currentPanel.webview.postMessage(message);
        });
    }
    registerListener() {
        let player = Player_1.getPlayer();
        player.playerMessage.on(Player_1.OnPlayerMessageEvent, this.onPlayerMessageBound);
        player.playerMessage.on(Player_1.OnSourcesChanged, this.onSourcesChangedBound);
        player.playerMessage.on(Player_1.OnPlayerStateChanged, this.onPlayerStateChangedBound);
    }
    removeListener() {
        let player = Player_1.getPlayer();
        player.playerMessage.removeListener(Player_1.OnPlayerMessageEvent, this.onPlayerMessageBound);
        player.playerMessage.removeListener(Player_1.OnPlayerStateChanged, this.onPlayerStateChangedBound);
        player.playerMessage.removeListener(Player_1.OnSourcesChanged, this.onSourcesChangedBound);
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
    onRangeChanged(begin) {
        Player_1.getPlayer().begin = begin;
    }
    onWebViewMessage(message) {
        switch (message.command) {
            case "player-stop": return this.onStopReceived();
            case "player-play": return this.onPlayReceived();
            case "player-pause": return this.onPauseReceived();
            case "player-update-range": return this.onRangeChanged(message.begin);
            case "sheetview-ready": return this.onSheetViewReady();
        }
    }
    onWebViewStateChanged(ev) {
    }
    onPanelDidDispose() {
        super.onPanelDidDispose();
        Player_1.getPlayer().begin = 0;
    }
    createPanelImpl() {
        return new Promise((resolve, reject) => {
            this.currentPanel = vscode.window.createWebviewPanel('werckmeister.SheetView', // Identifies the type of the webview. Used internally
            ViewTitle, // Title of the panel displayed to the user
            vscode.ViewColumn.Active, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            let jsPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'dist', 'WebViewApp.dist.js'));
            let htmlPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'sheetView.html'));
            this.currentPanel.iconPath = {
                light: vscode.Uri.file(this.getExtensionPath('resources', 'monitor_light.svg')),
                dark: vscode.Uri.file(this.getExtensionPath('resources', 'monitor_dark.svg'))
            };
            this.currentPanel.webview.onDidReceiveMessage(this.onWebViewMessage.bind(this), undefined, this.context.subscriptions);
            this.currentPanel.onDidChangeViewState(this.onWebViewStateChanged.bind(this));
            this.sheetViewReady.then(() => {
                this.updateSheetSourceMapAndSend();
                const player = Player_1.getPlayer();
                if (player.state === Player_1.PlayerState.Playing || player.state === Player_1.PlayerState.StartPlaying) {
                    this.startTitleUpdater();
                }
            });
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