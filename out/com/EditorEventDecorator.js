"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const Player_1 = require("../com/Player");
const EventDecorationType = vscode.window.createTextEditorDecorationType({
    fontWeight: 'bold',
    light: {
        color: 'green'
    },
    dark: {
        color: 'green'
    }
});
class EditorEventDecorator {
    constructor() {
        this.sheetInfo = null;
        this.sources = new Map();
        this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
        this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
    }
    onPlayerStateChanged(state) {
        if (state === Player_1.PlayerState.Stopped) {
            vscode.window.activeTextEditor.setDecorations(EventDecorationType, []);
        }
        if (state === Player_1.PlayerState.StartPlaying) {
            this.updateSheetInfo();
        }
    }
    getSourceInfo(id) {
        return this.sources.get(id);
    }
    updateSheetInfo() {
        let player = Player_1.getPlayer();
        this.sheetInfo = player.sheetInfo;
        if (!this.sheetInfo) {
            return;
        }
        for (let sourceInfo of this.sheetInfo.sources) {
            this.sources.set(sourceInfo.sourceId, sourceInfo);
        }
    }
    onPlayerMessage(message) {
        if (message.sheetEventInfos) {
            this.updateSheetEventInfos(message.sheetEventInfos);
        }
    }
    /**
     * some events will have trailing whitespaces, so we remove them
     * @param range
     */
    fixEventRange(range, document, eventInfo) {
        const word = document.getText(range);
        const trimAmmount = word.length - (word.trimRight()).length;
        if (trimAmmount <= 0) {
            return range;
        }
        const to = document.positionAt(eventInfo.endPosition - trimAmmount);
        return new vscode.Range(range.start, to);
    }
    sourceIsEditor(sourceInfo, editor) {
        if (!sourceInfo) {
            return false;
        }
        const editorPath = path.resolve(editor.document.uri.fsPath);
        const sourcePath = path.resolve(sourceInfo.path);
        return editorPath === sourcePath;
    }
    updateSheetEventInfos(sheetEventInfos) {
        for (let visibleEditor of vscode.window.visibleTextEditors) {
            const eventInfos = sheetEventInfos
                .filter(x => this.sourceIsEditor(this.getSourceInfo(x.sourceId), visibleEditor));
            if (eventInfos.length === 0) {
                continue;
            }
            const document = visibleEditor.document;
            if (document.isDirty) {
                return;
            }
            let decorations = [];
            for (let eventInfo of eventInfos) {
                const source = this.getSourceInfo(eventInfo.sourceId);
                const from = document.positionAt(eventInfo.beginPosition);
                const to = document.positionAt(eventInfo.endPosition);
                const range = new vscode.Range(from, to);
                const decoration = { range };
                decorations.push(decoration);
            }
            visibleEditor.setDecorations(EventDecorationType, decorations);
        }
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
}
exports.EditorEventDecorator = EditorEventDecorator;
let currentEditorEventDecorator = null;
function getEditorEventDecorator() {
    if (!currentEditorEventDecorator) {
        currentEditorEventDecorator = new EditorEventDecorator();
        currentEditorEventDecorator.registerListener();
    }
    return currentEditorEventDecorator;
}
exports.getEditorEventDecorator = getEditorEventDecorator;
//# sourceMappingURL=EditorEventDecorator.js.map