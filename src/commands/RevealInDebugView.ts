import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { InspectorView } from "../com/InspectorView";
import { Compiler } from "../com/Compiler";

export class RevealInDebugView extends ACommand {
    async execute(): Promise<void> {
        const compiler = new Compiler();
        if (!(await compiler.isDebugSymbolsSupported())) {
            vscode.window.showErrorMessage("This feature requires werckmeister >= 1.0.33");
        }
        const currentEditor = vscode.window.activeTextEditor;
        if (!currentEditor) {
            return;
        }
        const cursorPos = currentEditor.selection.start;
        const cursorOffset = currentEditor.document.offsetAt(cursorPos);
        await InspectorView.reveal(currentEditor.document.uri.fsPath, cursorOffset);
    }
}