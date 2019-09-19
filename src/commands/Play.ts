import { ACommand } from "./ACommand";
import * as vscode from 'vscode';

export class Play extends ACommand {
    execute(): void {
        vscode.window.showInformationMessage('Playing!');
    }
}