"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ACommand_1 = require("./ACommand");
const vscode = require("vscode");
const path_1 = require("path");
const WmPlayerPath = "/home/samba/workspace/werckmeister/build/sheetp";
class Play extends ACommand_1.ACommand {
    execute() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let sheetPath = editor.document.fileName;
        let cmd = `${WmPlayerPath} ${sheetPath}`;
        // exec(`${WmPlayerPath} ${filename}`, (err:any, stdout: any, stderr: any) => {
        //     if (!!err) {
        //         vscode.window.showErrorMessage(`Werckmeister: ${stderr}`);
        //         return;
        //     }
        //     vscode.window.showInformationMessage(`Playing: ${basename(filename)}`);
        // });
        let filename = path_1.basename(sheetPath);
        let terminalName = `Werckmeister: ${filename}`;
        let terminal = vscode.window.terminals.find(x => x.name === terminalName);
        if (!terminal) {
            terminal = vscode.window.createTerminal(terminalName);
        }
        terminal.show();
        terminal.sendText(cmd);
    }
}
exports.Play = Play;
//# sourceMappingURL=Play copy.js.map