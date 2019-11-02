import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { basename } from 'path';
import { getPlayer, Player } from '../com/Player';
import * as path from 'path';
import { EditorEventDecorator, getEditorEventDecorator } from "../com/EditorEventDecorator";
import { getSheetHistory } from "../com/SheetHistory";

export function isSheetFile(strPath:string): boolean {
    if (path.extname(strPath) === '.sheet') {
        return true;
    }
    return false;
}

export class Play extends ACommand {

    startPlayer(sheetPath:string) {
        let filename = basename(sheetPath);
        let player:Player = getPlayer();
        player.play(sheetPath) 
        .then(()=>{})
        .catch((ex)=>{
            vscode.window.showErrorMessage(`Werckmeister: ${ex}`);
        });
        getEditorEventDecorator();
    }

    async execute(): Promise<void> {
        
        const history = getSheetHistory();
        let sheetpath = history.currentFile;
        if (!sheetpath) {
            sheetpath = history.lastPlayedSheetFile;
        }
        if (!sheetpath) {
            vscode.window.showErrorMessage("no sheet file to play");
            return;
        }
        this.startPlayer(sheetpath);
    }
}