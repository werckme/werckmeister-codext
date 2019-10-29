"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
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
        this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
        this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
    }
    onPlayerStateChanged(state) {
        if (state === Player_1.PlayerState.Stopped) {
            vscode.window.activeTextEditor.setDecorations(EventDecorationType, []);
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
    updateSheetEventInfos(sheetEventInfos) {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        const editor = vscode.window.activeTextEditor;
        const document = editor.document;
        if (document.isDirty) {
            return;
        }
        let decorations = [];
        for (let eventInfo of sheetEventInfos) {
            const from = document.positionAt(eventInfo.beginPosition);
            const to = document.positionAt(eventInfo.endPosition);
            const range = new vscode.Range(from, to);
            const decoration = { range };
            decorations.push(decoration);
        }
        vscode.window.activeTextEditor.setDecorations(EventDecorationType, decorations);
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