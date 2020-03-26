import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { basename } from 'path';
import { getPlayer, Player } from '../com/Player';
import * as path from 'path';
import { getEditorEventDecorator } from "../com/EditorEventDecorator";
import { getSheetHistory } from "../com/SheetHistory";
import { WMCommandPlayTerminal } from "../extension";

export function isSheetFile(strPath:string): boolean {
    if (path.extname(strPath) === '.sheet') {
        return true;
    }
    return false;
}

export class Play extends ACommand {

    onError() {
        const document = vscode.workspace.textDocuments[0];
        const diagnosticCollection = vscode.languages.createDiagnosticCollection("werckmeister");
       
        diagnosticCollection.clear();

        let diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();
        let canonicalFile = vscode.Uri.file(document.fileName).toString();
        let range = new vscode.Range(1, 1, 1, 5);
        let diagnostics = diagnosticMap.get(canonicalFile);
        if (!diagnostics) { diagnostics = []; }
        diagnostics.push(new vscode.Diagnostic(range, "ACHTUNG!", vscode.DiagnosticSeverity.Error));
        diagnosticMap.set(canonicalFile, diagnostics);
        diagnosticMap.forEach((diags, file) => {
            diagnosticCollection.set(vscode.Uri.parse(file), diags);
        });
    }
    startPlayer(sheetPath:string) {
        let filename = basename(sheetPath);
        let player:Player = getPlayer();
        player.play(sheetPath) 
        .then(()=>{})
        .catch((ex)=>{
            this.onError();
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
        this.startPlayer(sheetpath);
    }
}