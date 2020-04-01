import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { getPlayer, Player } from '../com/Player';
import * as path from 'path';
import { getEditorEventDecorator } from "../com/EditorEventDecorator";
import { getSheetHistory } from "../com/SheetHistory";
import { WMExternalHelpInstallWerckmeisterExtension } from "../extension";
import { getLanguage } from "../language/Language";

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
            vscode.window.showErrorMessage(`failed to execute werckmeister: ${ex}`)
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
        
        try {
            const diagnose = await getLanguage().features.diagnostic.update(sheetpath);
            if (diagnose.hasErrors) {
                const sourcefile = diagnose.errorResult.sourceFile || "unkown location"
                vscode.window.showErrorMessage(` ${sourcefile}: ${diagnose.errorResult.errorMessage}`,'Ok');
                return;
            }
            this.startPlayer(sheetpath);
        } catch (ex) {
            vscode.window.showErrorMessage(`Failed to execute Werckmeister. 
Make sure that the Werckmeister path was set correctly.
Exception
${ex}
`, "Help").then(()=>{
    vscode.env.openExternal(vscode.Uri.parse(WMExternalHelpInstallWerckmeisterExtension));
});
        }
    }
}