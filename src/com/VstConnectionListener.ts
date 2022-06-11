import * as dgram from 'dgram';
import * as vscode from 'vscode';
import { IFunkfeuerMessage } from './Player';

const port = 99192;
const werckmeisterMagic = "werckmeister-vst-funk";

export type Callback = (msg:IFunkfeuerMessage) => void;
export type ListenerId = number;

let idCounter = 0;

export class VstConnectionListener {
    private onMessageEventEmitter: vscode.EventEmitter<IFunkfeuerMessage> = new vscode.EventEmitter<IFunkfeuerMessage>();
	private readonly onMessageEvent: vscode.Event<IFunkfeuerMessage> = this.onMessageEventEmitter.event;
    private socket: dgram.Socket|null = null;
    private listenerDisposables: Map<ListenerId, vscode.Disposable> = new Map<ListenerId, vscode.Disposable>();
    private onMessageCallback(msg:Buffer) {
        try {
            const json = JSON.parse(msg.toString());
            if (json.type !== werckmeisterMagic) {
                return;
            }
            if (!json.sheetPath) {
                return;
            }
            this.onMessageEventEmitter.fire(json);
        } catch(ex){}
    }

    start() {
        if (this.socket !== null) {
            return;
        }
        if (this.socket === null) {
            this.socket = dgram.createSocket('udp4');
        }
        this.socket.on('message', this.onMessageCallback.bind(this));
        this.socket.bind(port);
    }
    
    stop() {
        if (!this.socket) {
            return;
        }
        this.socket.close();
        this.socket = null;
    }

    addListener(callback: Callback): ListenerId {
        const id = ++idCounter;
        if (this.listenerDisposables.size === 0) {
            this.start();
        }
        this.listenerDisposables.set(id, this.onMessageEvent(callback));        
        return id;
    }

    removeListener(id: ListenerId) {
        const disposable = this.listenerDisposables.get(id);
        if (!disposable) {
            return;
        }
        disposable.dispose();
        this.listenerDisposables.delete(id);
        if(this.listenerDisposables.size == 0 && this.socket) {
            this.stop();
        }
    }
}
let instance:VstConnectionListener|null = null;
export function getVstConnectionListener(): VstConnectionListener {
    if (instance === null) {
        instance = new VstConnectionListener();
    }
    return instance;
}