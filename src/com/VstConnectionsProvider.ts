import * as vscode from 'vscode';
import * as path from 'path';
import { getPlayer, IFunkfeuerMessage } from './Player';
import { getVstConnectionListener } from './VstConnectionListener';

const port = 99192
const scanWaitTimeMillis = 2 * 1000;
export enum ConnectionState {
    Open = "Not Connected",
    Connected = "Connected"
}

export class Connection {
    private _state: ConnectionState = ConnectionState.Open;
    get state(): ConnectionState {
        return this._state;
    }

    set state(newValue: ConnectionState) {
        this._state = newValue;
    }

    constructor(public port: number, public sheetPath: string = "") {}
    get fileName(): string {
        return path.basename(this.sheetPath);
    }
    
};


let vstConnectionsProviderInstance: VstConnectionsProvider | null;

export class VstConnectionsProvider implements vscode.TreeDataProvider<VstConnectionTreeItem> {
    private connections: Map<string, Connection> = new Map<string, Connection>();
    private _onDidChangeTreeData: vscode.EventEmitter<VstConnectionTreeItem | undefined | null> = new vscode.EventEmitter<VstConnectionTreeItem | undefined | null>();
	readonly onDidChangeTreeData: vscode.Event<VstConnectionTreeItem | undefined | null> = this._onDidChangeTreeData.event;

    constructor() { }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: VstConnectionTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: VstConnectionTreeItem): Promise<VstConnectionTreeItem[]> {
        const connections = await this.scanForConnections();
        return connections.map(x => new VstConnectionTreeItem(x))
    }

    private async scanForConnections(): Promise<Connection[]> {
        return new Promise<Connection[]>((resolve, reject) => {
            const sheetFiles:Set<string> = new Set<string>();
            const vstConnectionListener = getVstConnectionListener();
            const listenerId = vstConnectionListener.addListener(msg => {
                if (!msg.sheetPath) {
                    return;
                }
                sheetFiles.add(msg.sheetPath);
            });
            setTimeout(() => {
                vstConnectionListener.removeListener(listenerId);
                const receivedSheets = Array.from(sheetFiles);
                const newConnections = receivedSheets
                    .filter(x => this.connections.has(x) === false)
                    .map(x => new Connection(port, x));
                for(const newConnection of newConnections) {
                    this.connections.set(newConnection.sheetPath, newConnection);
                }
                const lostConnections = Array.from(this.connections.keys())
                    .filter(x => receivedSheets.includes(x) === false);
                for(const lostConnectionId of lostConnections) {
                    const connection = this.connections.get(lostConnectionId);
                    if (connection && connection.state === ConnectionState.Connected) {
                        getPlayer().closeVstConnection();
                    }
                    this.connections.delete(lostConnectionId);
                }
                resolve(Array.from(this.connections.values()));
            }, scanWaitTimeMillis);
        });
    }  

}

export function getVstConnectionProvider(): VstConnectionsProvider {
    if (!vstConnectionsProviderInstance) {
        vstConnectionsProviderInstance = new VstConnectionsProvider();
    }
    return vstConnectionsProviderInstance;
}

export class VstConnectionTreeItem extends vscode.TreeItem {
    constructor(public connection: Connection) {
        super(`VST ${connection.fileName}`);
        this.description = connection.state;
        const isConnected = this.connection.state === ConnectionState.Connected;
        this.contextValue = `werckmeister-vst-instance-${isConnected?'connected':'open'}`;
    }
}