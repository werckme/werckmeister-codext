import * as vscode from 'vscode';
import { ACommand } from "./ACommand";

const notes = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

function isDigit(char: string): boolean {
    return /^[0-9]$/.test(char);
}

function isNote(char: string): boolean {
    return notes.includes(char);
}

export class CountQuarters extends ACommand {
    readNumber(text: string, cursor: number): {numberValue: number, cursor: number} {
        const digits: string[] = []
        while(true) {
            const char = text[cursor];
            if (!isDigit(char)) {
                break;
            }
            digits.push(char);
            ++cursor;
        }
        return { numberValue: Number.parseInt(digits.join('')), cursor }
    }
    readNextNoteEvent(text: string, cursor: number): {quarterValue: number, cursor: number} {
        while(true) {
            const char = text[cursor];
            if (!isDigit(char)) {
                break;
            }
            //digits.push(char);
            ++cursor;
        }
        return { quarterValue: 0, cursor }
    }
    async execute(...args: any[]): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        if (!text) {
            vscode.window.showErrorMessage("no text selected");
            return;
        }
        let quarters = 0;
        let lastQuarterValue = 1;
        for(let c=0; c < text.length;) {
            const char = text[c];
            if (isDigit(char)) {
                const {numberValue, cursor} = this.readNumber(text, c);
                c = cursor;
                continue;
            }
            ++c;
        }
        vscode.window.showInformationMessage(text);
    }
}