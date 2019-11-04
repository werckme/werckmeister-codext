import * as vscode from 'vscode';
import * as path from 'path';
import { EventEmitter } from 'events';
import { IsWindows } from './Player';

export const OnDispose = "OnDispose";

export abstract class AWebView  {

    abstract panel: vscode.WebviewPanel|null;
    onLifecycleEvent: EventEmitter = new EventEmitter();

	constructor(protected context: vscode.ExtensionContext) {
	}

	toWebViewUri(uri: vscode.Uri): string {
        if (!this.panel) {
            throw new Error("panel == null");
        }
        const result = this.panel.webview.asWebviewUri(uri).toString();
        return result;
    }
    
    getExtensionPath(...pathComponents:string[]): string {
        return path.join(this.context.extensionPath, ...pathComponents);
    }

	registerListener() {
	}

	removeListener() {
	}

    onPanelDidDispose() {}

    protected abstract createPanelImpl(): Promise<vscode.WebviewPanel>;

    async createPanel(): Promise<void> {
        const panel = await this.createPanelImpl();
        this.registerListener();
        panel.onDidDispose(()=>{
            this.removeListener();
            this.onLifecycleEvent.emit(OnDispose);
            this.onPanelDidDispose();
        });
    }

}