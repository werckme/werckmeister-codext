import * as vscode from 'vscode';
import * as path from 'path';
import * as dgram from 'dgram';
import { IFunkfeuerMessage } from './Player';

const numParalelRequest = 500;
const portRange = [9000, 10000];

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
        if (newValue === ConnectionState.Connected) {
            establishedConnections.push(this);
        } else {
            establishedConnections.splice(establishedConnections.indexOf(this), 1);
        }
    }

    constructor(public port: number = 0, public sheetPath: string = "") {}
    get fileName(): string {
        return path.basename(this.sheetPath);
    }
    
};

const werckmeisterMagic = "werckmeister-vst-funk";
let vstConnectionsProviderInstance: VstConnectionsProvider | null;

const establishedConnections: Connection[] = [];

export class VstConnectionsProvider implements vscode.TreeDataProvider<VstConnectionTreeItem> {

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
        let results: Connection[] = [];
        for(let portBegin = portRange[0]; portBegin < portRange[1]; portBegin+= numParalelRequest) {
            const tasks:Promise<Connection>[] = [];
            const portEnd = portBegin + numParalelRequest;
            for(let port = portBegin; port < portEnd; ++port) {
                tasks.push(this.tryToConnect(port));
            }
            results = [...results, ...await Promise.all(tasks)];
        }
        return results.filter(x => !!x.port);
    }

    private tryToConnect(port: number): Promise<Connection> {
        return new Promise<Connection>(resolve => {
            const established = establishedConnections.find(x=>x.port===port) 
            if(!!established) {
                resolve(established);
                return;
            }
            let socket: dgram.Socket = dgram.createSocket('udp4');
            socket.on('message', (msg) => {
                try {
                    const json: IFunkfeuerMessage = JSON.parse(msg.toString());
                    if (json.type !== werckmeisterMagic) {
                        resolve(new Connection());
                        return;
                    }
                    resolve(new Connection(port, json.sheetPath));
                } catch {
                    resolve(new Connection());
                } finally {
                    socket.close();
                }
            });
            socket.on('error', (msg) => {
                resolve(new Connection());
            });            
            socket.bind(port);
            const cancel = () => {
                resolve(new Connection());
                socket.close();
            };
            setTimeout(cancel, 500);
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