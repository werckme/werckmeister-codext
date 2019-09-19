import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { basename } from 'path';
import { exec } from 'child_process';

const WmPlayerPath = "/home/samba/workspace/werckmeister/build/sheetp";

export class PlayTerminal extends ACommand {
    async execute(): Promise<void> {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let sheetPath = editor.document.fileName;
        let cmd = `${WmPlayerPath} ${sheetPath}`;
        let filename = basename(sheetPath);
        let terminalName = `Werckmeister: ${filename}`;
        let terminal:vscode.Terminal|undefined = vscode.window.terminals.find(x=>x.name===terminalName);
        if (!terminal) {
            terminal = vscode.window.createTerminal(terminalName);
        }
        terminal.show();
        terminal.sendText(cmd);
    }
}