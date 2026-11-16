import * as vscode from 'vscode';
import { transposeOctave, TextEdit } from 'werckmeister-parser';
import { ACommand } from "./ACommand";

/**
 * Transposes the notes and degrees of all selections one octave up or down.
 * Notes at the octave limit (''''' / ,,,,,) are skipped.
 */
abstract class ATransposeOctave extends ACommand {
    protected abstract direction: 1 | -1;

    async execute(...args: any[]): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        const text = document.getText();
        const edits = new Map<number, TextEdit>();
        for (const selection of editor.selections) {
            const range = {
                start: document.offsetAt(selection.start),
                end: document.offsetAt(selection.end),
            };
            // the whole document is parsed, so the selection may start or end anywhere
            for (const edit of transposeOctave(text, this.direction, { range }).edits) {
                edits.set(edit.start, edit); // overlapping selections: transpose each pitch only once
            }
        }
        if (edits.size === 0) {
            return;
        }
        await editor.edit(builder => {
            edits.forEach(edit => {
                const range = new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end));
                builder.replace(range, edit.newText);
            });
        });
    }
}

export class TransposeOctaveUp extends ATransposeOctave {
    protected direction: 1 = 1;
}

export class TransposeOctaveDown extends ATransposeOctave {
    protected direction: -1 = -1;
}
