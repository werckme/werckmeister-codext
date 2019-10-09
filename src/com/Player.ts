const WmPlayerPath = "/home/samba/workspace/werckmeister/build/sheetp";
const UDP_PORT = 8080;
import { exec, ChildProcess } from 'child_process';
import * as dgram from 'dgram';
import * as EventEmitter from 'events';

const Config = {
    watch: true
};

export const OnPlayerMessageEvent = 'OnPlayerMessageEvent';

export class Player {
    currentFile: string|null = null;
    socket: dgram.Socket|null = null;
    onPlayerMessage: EventEmitter = new EventEmitter();
    private process: ChildProcess|null = null;
    get isPlaying(): boolean {
        return !!this.process;
    }
    
    startUdpListener() {
		if (this.socket === null) {
			this.socket = dgram.createSocket('udp4');
        }
        this.socket.on('message', (msg) => {
            this.onPlayerMessage.emit(OnPlayerMessageEvent, Number.parseFloat(msg.toString()));
        });
        this.socket.bind(UDP_PORT);
    }

    stopUdpListener() {
        if (this.socket === null) {
            return;
        }
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
    }
    
    play(sheetPath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (this.isPlaying) {
                await this.stop();
            }
            
            let cmd = `${WmPlayerPath} ${sheetPath} ${this.configToString()}`;
            this.currentFile = sheetPath;
            this.process = exec(cmd, (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    reject(stderr);
                    this.process = null;
                    this.currentFile = null;
                    return;
                }
                resolve();
                this.process = null;
                this.currentFile = null;
            });
            this.startUdpListener();
        });
    }
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.process!.kill("SIGINT");
            let waitUntilEnd = () => {
                if (!this.isPlaying) {
                    resolve();
                    return;
                }
                setTimeout(waitUntilEnd, 100);
            }
            waitUntilEnd();
        });
    }
    private configToString() {
        let options = [
            `--funkfeuer=localhost:${UDP_PORT}`
            ,'--nostdout'
        ];
        if (Config.watch) {
            options.push("--watch");
        }
        return options.join(" ");
    }
}

let globalPlayer: Player;

export function getPlayer(): Player {
    if (!globalPlayer) {
        globalPlayer = new Player();
    }
    return globalPlayer;
}