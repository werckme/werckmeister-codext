import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { basename } from 'path';

import { getPlayer, Player } from '../com/Player';

export class Stop extends ACommand {
    async execute(): Promise<void> {
        let player:Player = getPlayer();
        let currentFile = player.currentFile;
        player.stop()
            .then(()=>{})
            .catch((ex)=>{
                vscode.window.showErrorMessage(ex);
            });
        if (!!currentFile) {
            vscode.window.showInformationMessage(`Stopped: ${basename(currentFile)}`);
        }
    }
}