import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { basename } from 'path';
import { getPlayer, Player } from '../com/Player';
import * as path from 'path';

let lastSheetFile:string|null = null;

export class Play extends ACommand {

    startPlayer(sheetPath:string) {
        let filename = basename(sheetPath);
        let player:Player = getPlayer();
        player.play(sheetPath) 
        .then(()=>{})
        .catch((ex)=>{
            vscode.window.showErrorMessage(`Werckmeister: ${ex}`);
        });
    }

    isSheetFile(strPath:string): boolean {
        if (path.extname(strPath) === '.sheet') {
            return true;
        }
        return false;
    }

    async execute(): Promise<void> {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            if (lastSheetFile !== null) {
                this.startPlayer(lastSheetFile)
            }
            return;
        }
        let sheetPath = editor.document.fileName;
        if (!this.isSheetFile(sheetPath)) {
            if (lastSheetFile !== null) {
                this.startPlayer(lastSheetFile)
            }
            return; 
        }
        this.startPlayer(sheetPath);
        lastSheetFile = sheetPath;
    }
}