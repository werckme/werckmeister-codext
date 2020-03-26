import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { basename } from 'path';
import { toWMBINPath, PlayerExecutable, IsWindows } from "../com/Player";

export class PlayTerminal extends ACommand {
    async execute(): Promise<void> {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let sheetPath = editor.document.fileName;
        let cmd = `${toWMBINPath(PlayerExecutable)} ${sheetPath} --watch`;
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