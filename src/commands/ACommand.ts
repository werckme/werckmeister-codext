import * as vscode from 'vscode';

export abstract class ACommand {
    args: any[] | undefined;
    constructor(protected context: vscode.ExtensionContext) {

    }
    abstract execute(): Promise<void>;
}