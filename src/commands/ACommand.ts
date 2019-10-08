import * as vscode from 'vscode';

export abstract class ACommand {
    constructor(protected context: vscode.ExtensionContext) {

    }
    abstract execute(): Promise<void>;
}