import * as vscode from 'vscode';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState } from "../com/Player";
import { ISheetInfo, ISheetEventInfo } from './SheetInfo';


const EventDecorationType = vscode.window.createTextEditorDecorationType({
    fontWeight: 'bold',
	light: {
        color: 'green'
	},
	dark: {
        color: 'green'
	}
});


export class EditorEventDecorator {

	onPlayerMessageBound: any;
    onPlayerStateChangedBound: any;
	constructor() {
		this.onPlayerMessageBound = this.onPlayerMessage.bind(this);
		this.onPlayerStateChangedBound = this.onPlayerStateChanged.bind(this);
	}

	onPlayerStateChanged(state: PlayerState) {
        if (state===PlayerState.Stopped) {
            vscode.window.activeTextEditor!.setDecorations(EventDecorationType, []);
        }
	}

	onPlayerMessage(message:any) {
        if (message.sheetEventInfos) {
            this.updateSheetEventInfos(message.sheetEventInfos);
        }
    }
    
    /**
     * some events will have trailing whitespaces, so we remove them
     * @param range 
     */
    private fixEventRange(range: vscode.Range, document:vscode.TextDocument, eventInfo: ISheetEventInfo):vscode.Range {
        const word = document.getText(range);
        const trimAmmount = word.length - (word.trimRight()).length;
        if (trimAmmount <= 0) {
            return range;
        }
        const to = document.positionAt(eventInfo.endPosition - trimAmmount);
        return new vscode.Range(range.start, to);
    }

    protected updateSheetEventInfos(sheetEventInfos: ISheetEventInfo[]) {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        const editor:vscode.TextEditor = vscode.window.activeTextEditor as vscode.TextEditor;
        const document:vscode.TextDocument = editor.document;
        if (document.isDirty) {
            return;
        }
        let decorations = [];
        for (let eventInfo of sheetEventInfos) {
            const from = document.positionAt(eventInfo.beginPosition);
            const to = document.positionAt(eventInfo.endPosition);
            const range = new vscode.Range(from, to);
            const decoration = {range};
            decorations.push(decoration);
        }
        vscode.window.activeTextEditor!.setDecorations(EventDecorationType, decorations);
    }

	registerListener() {
		let player:Player = getPlayer();
		player.playerMessage.on(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.on(OnPlayerStateChanged, this.onPlayerStateChangedBound);
	}

	removeListener() {
		let player:Player = getPlayer();
		player.playerMessage.removeListener(OnPlayerMessageEvent, this.onPlayerMessageBound);
		player.playerMessage.removeListener(OnPlayerStateChanged, this.onPlayerStateChangedBound);
	}

}

let currentEditorEventDecorator:EditorEventDecorator|null = null;

export function getEditorEventDecorator():EditorEventDecorator {
    if (!currentEditorEventDecorator) {
        currentEditorEventDecorator = new EditorEventDecorator();
        currentEditorEventDecorator.registerListener();
    }
    return currentEditorEventDecorator;
}