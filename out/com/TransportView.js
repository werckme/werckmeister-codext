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
const fs = require("fs");
const Player_1 = require("../com/Player");
const AWebView_1 = require("./AWebView");
const extension_1 = require("../extension");
const ViewTitle = "Sheet";
const TitleUpdaterIntervalMillis = 500;
class TransportView extends AWebView_1.AWebView {
    constructor(context) {
        super(context);
        this.currentPanel = null;
        this.sheetInfo = null;
        this.onViewReady = () => { };
        this.titleUpdater = null;
        this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
        this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
        this.onSourcesChangedBound = this.onSourcesChanged.bind(this);
        this.viewReady = new Promise(resolve => {
            this.onViewReady = resolve;
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
    onSourcesChanged() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentPanel) {
                return;
            }
            const message = yield this.updateSheetSourceMap();
            this.currentPanel.webview.postMessage(message);
        });
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
            this.currentPanel.title = `${ViewTitle} ${time}`;
        }
    }
    onPlayerMessage(message) {
        if (!this.currentPanel) {
            return;
        }
        this.currentPanel.webview.postMessage(message);
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
            return { duration: this.sheetInfo.duration };
        });
    }
    registerListener() {
        let player = Player_1.getPlayer();
        player.playerMessage.on(Player_1.OnPlayerMessageEvent, this.onPlayerMessageBound);
        player.playerMessage.on(Player_1.OnPlayerStateChanged, this.onPlayerStateChangedBound);
        player.playerMessage.on(Player_1.OnSourcesChanged, this.onSourcesChangedBound);
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
            case "transportview-ready": return this.onViewReady();
        }
    }
    onWebViewStateChanged(ev) {
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
    onPanelDidDispose() {
        super.onPanelDidDispose();
        Player_1.getPlayer().begin = 0;
    }
    createPanelImpl() {
        return new Promise((resolve, reject) => {
            this.currentPanel = vscode.window.createWebviewPanel('werckmeister.TransportView', // Identifies the type of the webview. Used internally
            ViewTitle, // Title of the panel displayed to the user
            vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            });
            let jsPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'dist', 'WebViewApp.dist.js'));
            let htmlPath = vscode.Uri.file(this.getExtensionPath('WebViewApp', 'transportView.html'));
            this.currentPanel.webview.onDidReceiveMessage(this.onWebViewMessage.bind(this), undefined, this.context.subscriptions);
            this.currentPanel.onDidChangeViewState(this.onWebViewStateChanged.bind(this));
            this.viewReady.then(() => {
                const player = Player_1.getPlayer();
                if (player.state === Player_1.PlayerState.Playing || player.state === Player_1.PlayerState.StartPlaying) {
                    this.startTitleUpdater();
                }
                this.updateSheetSourceMapAndSend();
            });
            fs.readFile(htmlPath.fsPath, 'utf8', (err, data) => {
                data = data.replace("$mainSrc", this.toWebViewUri(jsPath));
                this.currentPanel.webview.html = data;
                resolve(this.currentPanel);
            });
        });
    }
}
exports.TransportView = TransportView;
//# sourceMappingURL=TransportView.js.map