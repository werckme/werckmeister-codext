import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState } from "../com/Player";
import { ISheetInfo, ISheetEventInfo, ISourceInfo } from './SheetInfo';


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
    sheetInfo: ISheetInfo|null = null;
    sources = new Map<number, ISourceInfo>();
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
        if (state===PlayerState.StartPlaying) {
            this.updateSheetInfo();
        }
	}

    getSourceInfo(id:number): ISourceInfo|undefined {
        return this.sources.get(id);
    }

    updateSheetInfo() {
        let player:Player = getPlayer();
		this.sheetInfo = player.sheetInfo;
		if (!this.sheetInfo) {
			return;
        }
        for (let sourceInfo of this.sheetInfo.sources) {
            this.sources.set(sourceInfo.sourceId, sourceInfo);
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

    protected sourceIsEditor(sourceInfo: ISourceInfo|undefined, editor: vscode.TextEditor): boolean {
        if (!sourceInfo) {
            return false;
        }
        const editorPath = path.resolve(editor.document.uri.fsPath);
        const sourcePath = path.resolve(sourceInfo.path);
        return editorPath === sourcePath;
    }

    protected updateSheetEventInfos(sheetEventInfos: ISheetEventInfo[]) {
        for (let visibleEditor of vscode.window.visibleTextEditors) {
            const eventInfos = sheetEventInfos
                .filter(x => this.sourceIsEditor(this.getSourceInfo(x.sourceId), visibleEditor))
            ;
            if (eventInfos.length === 0) {
                continue;
            }
            const document:vscode.TextDocument = visibleEditor.document;
            if (document.isDirty) {
                return;
            }
            let decorations = [];
            for (let eventInfo of eventInfos) {
                const source = this.getSourceInfo(eventInfo.sourceId);
                const from = document.positionAt(eventInfo.beginPosition);
                const to = document.positionAt(eventInfo.endPosition);
                const range = new vscode.Range(from, to);
                const decoration = {range};
                decorations.push(decoration);
            }
            visibleEditor.setDecorations(EventDecorationType, decorations);
        }
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