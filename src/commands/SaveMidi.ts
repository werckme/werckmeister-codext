import { Play } from "./Play";
import * as vscode from 'vscode';
import { Compiler, CompilerMode } from "../com/Compiler";
import * as fspath from 'path';

const lastSavePaths: {[sheetPath: string]: string} = {};

export class SaveMidi extends Play {

    async startPlayer(sheetPath:string) {
        const lastSavePath:string|null = lastSavePaths[sheetPath] || null;
        let defaultUri: vscode.Uri|undefined = undefined;
        if (lastSavePath)  {
            defaultUri = vscode.Uri.file(lastSavePath);
        }
        const dlgResult = await vscode.window.showSaveDialog({defaultUri, filters: {"Midi Files": ["mid", "midi"]}});
        if (!dlgResult || !dlgResult.fsPath) {
            return;
        }
        const path = dlgResult.fsPath;
        lastSavePaths[sheetPath] = path;
        const filename = fspath.basename(path);
        const dirname = fspath.dirname(path);
		try {
            const compiler = new Compiler();
            await compiler.compile(sheetPath, CompilerMode.normal, path);
            vscode.window.showInformationMessage(`saved: ${filename} in ${dirname}`)
		} catch {
			vscode.window.showErrorMessage(`saving midi file: "${path}" failed`);
		}
    }

}