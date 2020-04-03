import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { getPlayer, Player } from '../com/Player';
import * as path from 'path';
import { getEditorEventDecorator } from "../com/EditorEventDecorator";
import { getSheetHistory } from "../com/SheetHistory";
import { WMExternalHelpInstallWerckmeisterExtension, WMExternalWerckmeisterDownload } from "../extension";
import { getLanguage } from "../language/Language";
import { VersionMismatchException } from "../com/Compiler";

export function isSheetFile(strPath:string): boolean {
    if (path.extname(strPath) === '.sheet') {
        return true;
    }
    return false;
}

function showCompilerError(ex: Error) 
{
    const action = "Help";
    vscode.window.showErrorMessage(`Failed to execute Werckmeister. 
    Make sure that the Werckmeister path was set correctly.
    ${ex}
    `, action).then((val)=>{
        if (val !== action) {
            return;
        }
        vscode.env.openExternal(vscode.Uri.parse(WMExternalHelpInstallWerckmeisterExtension));
    });
}

function showVersionMismatchError(ex: VersionMismatchException) 
{
    const action = "Get Latest Version";
    vscode.window.showErrorMessage(`Oh Weh! Failed to execute Werckmeister. The min. required Werckmeister version is ${ex.minimumVersion}.
You are using version ${ex.currentVersion}.`, action).then((val)=>{
        if (val !== action) {
            return;
        }
        vscode.env.openExternal(vscode.Uri.parse(WMExternalWerckmeisterDownload));
    });
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
        } 
        catch (ex) {
            if (ex instanceof VersionMismatchException) {
                showVersionMismatchError(ex as VersionMismatchException);
            } else {
                showCompilerError(ex);
            }
           
        }
    }
}