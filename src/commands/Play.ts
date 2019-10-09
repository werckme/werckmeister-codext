import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { basename } from 'path';
import { getPlayer, Player } from '../com/Player';

export class Play extends ACommand {

    async execute(): Promise<void> {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let sheetPath = editor.document.fileName;
        let filename = basename(sheetPath);
        let player:Player = getPlayer();
        player.play(sheetPath)
        .then(()=>{})
        .catch((ex)=>{
            vscode.window.showErrorMessage(`Werckmeister: ${ex}`);
        });
        vscode.window.showInformationMessage(`Playing: ${filename}`);
    }
}