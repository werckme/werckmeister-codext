/**
 * stores the used sheet files in a history
 */

import * as vscode from 'vscode';
import { getPlayer, OnPlayerStateChanged, PlayerState } from './Player';
import { isSheetFile } from '../commands/Play';
import * as _ from 'lodash';
import * as fs from 'fs';

class SheetHistory {
    fileHistory: string[] = [];
    lastplayed: string|undefined = undefined;
    constructor() {
        vscode.window.onDidChangeActiveTextEditor(this.onTextEditorChanged.bind(this));
        if (vscode.window.activeTextEditor) {
            this.onDocument(vscode.window.activeTextEditor.document);
        }
        const player = getPlayer();
        player.playerMessage.on(OnPlayerStateChanged, this.onPlayerStateChanged.bind(this));
    }

    onTextEditorChanged(editor:vscode.TextEditor|undefined) {
        if (!editor) {
            return;
        }
        this.onDocument(editor.document);
    }

    onDocument(document: vscode.TextDocument) {
        const fspath = document.uri.fsPath;
        if (!fspath) {
            return;
        }
        if (!fs.existsSync(fspath)) {
            return;
        }
        this.fileHistory.push(fspath);
    }

    onPlayerStateChanged(state: PlayerState) {
        if (state === PlayerState.Playing) {
            const player = getPlayer();
            this.lastplayed = player.currentFile as string;
        }
    }

    get currentFile() : string | undefined {
        const filePath = _(this.fileHistory)
            .last();
        if (!filePath) {
            return undefined;
        }
        if (!isSheetFile(filePath)) {
            return undefined;
        }
        return filePath;
    }

    get lastPlayedSheetFile() : string | undefined {
        return this.lastplayed;
    }

    get lastVisitedSheetFile(): string | undefined {
        return _(this.fileHistory)
            .filter(file => file.endsWith('.sheet'))
            .last();
    }

}

let _currentHistory: SheetHistory;

export function getSheetHistory() {
    if (!_currentHistory) {
        _currentHistory = new SheetHistory();
    }
    return _currentHistory;
}
