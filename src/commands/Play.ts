import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { getPlayer, Player } from '../com/Player';
import * as path from 'path';
import { getEditorEventDecorator } from "../com/EditorEventDecorator";
import { getSheetHistory } from "../com/SheetHistory";
import { WMCommandPlayTerminal } from "../extension";
import { getLanguage } from "../language/Language";
import { DiagnoseState } from "../language/features/Diagnostic";

export function isSheetFile(strPath:string): boolean {
    if (path.extname(strPath) === '.sheet') {
        return true;
    }
    return false;
}

export class Play extends ACommand {

    startPlayer(sheetPath:string) {
        let player:Player = getPlayer();
        player.play(sheetPath) 
        .then(()=>{})
        .catch((ex)=>{
            vscode.window.showErrorMessage(`Werckmeister has dectected an error`, "show")
                .then((item: string|undefined) =>{
                    if (!item) {
                        return;
                    }
                    if (item === 'show') {
                        vscode.commands.executeCommand(WMCommandPlayTerminal);
                    }
                });
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
        
        const diagnose = await getLanguage().features.diagnostic.update(sheetpath);
        if (diagnose === DiagnoseState.HasErrors) {
            vscode.window.showErrorMessage(`Werckmeister: failed to compile`)
            return;
        }
        this.startPlayer(sheetpath);
    }
}