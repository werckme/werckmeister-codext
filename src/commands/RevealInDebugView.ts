import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { InspectorView } from "../com/InspectorView";

export class RevealInDebugView extends ACommand {
    async execute(): Promise<void> {
        const currentEditor = vscode.window.activeTextEditor;
        if (!currentEditor) {
            return;
        }
        const cursorPos = currentEditor.selection.start;
        const cursorOffset = currentEditor.document.offsetAt(cursorPos);
        await InspectorView.reveal(currentEditor.document.uri.fsPath, cursorOffset);
    }
}