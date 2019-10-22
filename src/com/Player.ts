import { exec, ChildProcess } from 'child_process';
import * as dgram from 'dgram';
import * as EventEmitter from 'events';
import { ISourceMap } from './SourceMap';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const freeUdpPort = require('udp-free-port');
const Win32SigintWorkaroundFile = "keepalive";
const IsWindows:boolean = process.platform === 'win32';

function playerWorkingDirectory() {
    const settings = vscode.workspace.getConfiguration('werckmeister');
    const strPath = settings.werckmeisterBinaryDirectory as string;
    if (!strPath) {
        throw new Error(`missing \"Werckmeister BinaryDirectory\" configuration. (Settings->Extensions->Werckmeister)`);
    }
    return strPath;
}

function toWMBINPath(executable: string) {
    return path.join(playerWorkingDirectory(), executable);
}

function killProcess(childProcess:ChildProcess) {
    if (IsWindows) {
        fs.unlinkSync(toWMBINPath(Win32SigintWorkaroundFile));
        return;
    }
    childProcess!.kill("SIGINT");
}

const PlayerExecutable = IsWindows ? 'sheetp.exe' : 'sheetp';

class Config {
    watch: boolean = false;
    funkfeuer: boolean = false;
    sourceMap: boolean = false;
    port: number = 8080;
    sheetPath: string = "";
    sigintWorkaround:boolean = IsWindows ? true : false;
};

function getFreeUdpPort(): Promise<number> {
    return new Promise((resolve, reject) => {
        freeUdpPort((err:any, port:number) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(port);
        });  
    });
}

export const OnPlayerMessageEvent = 'OnPlayerMessageEvent';
export const OnPlayerStateChanged = 'OnPlayerStateChanged';

export enum PlayerState {
    Undefined,
    Playing,
    Stopped,
    Stopping,
    Paused
}

export class Player {
    private _state: PlayerState = PlayerState.Stopped;
    socket: dgram.Socket|null = null;
    playerMessage: EventEmitter = new EventEmitter();
    private process: ChildProcess|null = null;
    sourceMap: ISourceMap|null = null;
    currentFile: string|null = null;
    private _sheetTime: number = 0;
    get wmPlayerPath(): string {
        return toWMBINPath(PlayerExecutable);
    }

    get isPlaying(): boolean {
        return !!this.process;
    }

    get sheetTime(): number {
        return this._sheetTime;
    }

    set sheetTime(val: number) {
        this._sheetTime = val;
        if (val === 0) {
            this.playerMessage.emit(exports.OnPlayerMessageEvent, {sheetTime: 0});
        }
    }
   
    get state(): PlayerState {
        return this._state;
    }

    set state(val: PlayerState) {
        this._state = val;
        this.playerMessage.emit.bind(this.playerMessage, OnPlayerStateChanged, this._state);
    }

    updateSheetTime(udpMessage:any) {
        if (udpMessage.sheetTime) {
            this.sheetTime = udpMessage.sheetTime;
        }
    }

    startUdpListener(port: number) {
        if (this.socket !== null) {
            return;
        }
        if (this.socket === null) {
            this.socket = dgram.createSocket('udp4');
        }
        this.socket.on('message', (msg) => {
            let object = JSON.parse(msg.toString());
            this.updateSheetTime(object);
            this.playerMessage.emit(exports.OnPlayerMessageEvent, object);
        });
        this.socket.bind(port);
        console.log(`listen udp messages on port ${port}`);
    }

    stopUdpListener() {
        if (this.socket === null) {
            return;
        }
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
        console.log('udp listener stopped');
    }
    
    private _execute(cmd:string, callback: (err:any, stdout: any, stderr: any)=>void): ChildProcess {
        console.log(cmd);
        return exec(cmd, {cwd: playerWorkingDirectory()}, callback);
    }

    private updateSourceMap(): Promise<ISourceMap> {
        return new Promise((resolve, reject) => {
            const config = new Config();
            config.sourceMap = true;
            config.sheetPath = this.currentFile as string;
            let cmd = `${this.wmPlayerPath} ${this.configToString(config)}`;
            this._execute(cmd, (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    reject(err);
                    return;
                }
                try {            
                    let json = JSON.parse(stdout);
                    resolve(json);
                } catch(ex)  {
                    reject(ex);
                }
            });
        }).then((sourceMap)=>{
            this.sourceMap = sourceMap as ISourceMap;
            this.sourceMap.mainDocument = this.currentFile as string;
            return this.sourceMap;
        });
    }

    async play(sheetPath: string): Promise<void> {
        this.currentFile = sheetPath;
        await this.updateSourceMap();
        return this._startPlayer(sheetPath);
    }

    pause(): Promise<void> {
        return this.stop();
    }

    private async _startPlayer(sheetPath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (this.isPlaying) {
                await this.stop();
            }
            const nextFreePort = await getFreeUdpPort();
            const config = new Config();
            config.funkfeuer = true;
            config.watch = true;
            config.port = nextFreePort;
            config.sheetPath = sheetPath;
            let cmd = `${this.wmPlayerPath} ${this.configToString(config)}`;
            setTimeout(()=>{this.state = PlayerState.Playing}, 10);
            this.process = this._execute(cmd, (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    reject(stderr);
                    this.process = null;
                    this.currentFile = null;
                    return;
                }
                resolve();
                this.stopUdpListener();
                this.process = null;
                if (this.state === PlayerState.Stopped || this.state === PlayerState.Stopping) {
                    this.currentFile = null;
                    this.sheetTime = 0;
                }
            });
            this.startUdpListener(config.port);
        });
    }

    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.stopUdpListener();
            this._state = PlayerState.Stopping;
            killProcess(this.process as ChildProcess);
            let waitUntilEnd = () => {
                if (!this.isPlaying) {
                    resolve();
                    this._state = PlayerState.Stopped;
                    return;
                }
                setTimeout(waitUntilEnd, 100);
            }
            waitUntilEnd();
        });
    }

    private configToString(config: Config) {
        if (!config.sheetPath) {
            throw new Error('missing sheet path');
        }
        let options = [
            config.sheetPath
            ,'--notime'
        ];
        if (config.watch) {
            options.push("--watch");
        }
        if (config.funkfeuer) {
            options.push(`--funkfeuer=localhost:${config.port}`);
        }
        if (config.sourceMap) {
            options.push('--sources');
        }
        if (config.sigintWorkaround) {
            options.push('--win32-sigint-workaround');
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