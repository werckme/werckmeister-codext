import * as vscode from 'vscode';
import * as path from 'path';
import { EventEmitter } from 'events';

export const OnDispose = "OnDispose";

export abstract class AWebView  {

    onLifecycleEvent: EventEmitter = new EventEmitter();

	constructor(protected context: vscode.ExtensionContext) {
	}

	toWebViewUri(uri: vscode.Uri): string {
		// panel.webview.asWebviewUri is not available at runtime for some reason
		return `vscode-resource:${uri.path}`;
    }
    
    getExtensionPath(...pathComponents:string[]): string {
        return path.join(this.context.extensionPath, ...pathComponents);
    }

	registerListener() {
	}

	removeListener() {
	}

    protected abstract createPanelImpl(): Promise<vscode.WebviewPanel>;

    async createPanel(): Promise<void> {
        const panel = await this.createPanelImpl();
        this.registerListener();
        panel.onDidDispose(()=>{
            this.removeListener();
            this.onLifecycleEvent.emit(OnDispose);
        });
    }

}