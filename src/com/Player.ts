import { exec, ChildProcess } from 'child_process';
import * as dgram from 'dgram';
import * as EventEmitter from 'events';
import { ISheetInfo, IWarning } from './SheetInfo';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const freeUdpPort = require('udp-free-port');
const Win32SigintWorkaroundFile = "keepalive";
export const IsWindows:boolean = process.platform === 'win32';
export const PlayerExecutable = IsWindows ? 'sheetp.exe' : 'sheetp';

export interface IFunkfeuerMessage {
    sheetTime: number;
    lastUpdateTimestamp: number;
    sheetEventInfos: any[];
}

function playerWorkingDirectory() {
    const settings = vscode.workspace.getConfiguration('werckmeister');
    const strPath = settings.werckmeisterBinaryDirectory as string;
    if (!strPath) {
        throw new Error(`missing \"Werckmeister BinaryDirectory\" configuration. (Settings->Extensions->Werckmeister)`);
    }
    return strPath;
}

export function toWMBINPath(executable: string) {
    return path.join(playerWorkingDirectory(), executable);
}

function killProcess(childProcess:ChildProcess) {
    if (IsWindows) {
        fs.unlinkSync(toWMBINPath(Win32SigintWorkaroundFile));
        return;
    }
    childProcess!.kill("SIGINT");
}


class Config {
    watch: boolean = false;
    funkfeuer: boolean = false;
    info: boolean = false;
    port: number = 8080;
    begin: number = 0;
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
export const OnSourcesChanged = 'OnSourcesChanged';

export enum PlayerState {
    Undefined,
    StartPlaying,
    Playing,
    Stopped,
    Stopping,
    Pausing,
    Paused
}

export class Player {
    private _state: PlayerState = PlayerState.Stopped;
    private socket: dgram.Socket|null = null;
    playerMessage: EventEmitter = new EventEmitter();
    private process: ChildProcess|null = null;
    sheetInfo: ISheetInfo|null = null;
    currentFile: string|null = null;
    begin: number = 0;
    private _sheetTime: number = 0;
    private lastUpdateTimestamp = 0;
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
            this.playerMessage.emit(OnPlayerMessageEvent, {sheetTime: 0});
        }
    }
   
    get state(): PlayerState {
        return this._state;
    }

    private reset() {
        this.currentFile = null;
        this.sheetTime = 0;
        this.lastUpdateTimestamp = 0;
    }
    set state(val: PlayerState) {
        if (this.state === val) {
            return;
        }
        console.log(PlayerState[val]);
        this._state = val;
        if (this._state === PlayerState.Stopped) {
            this.reset();
        }
        this.playerMessage.emit(OnPlayerStateChanged, this._state);
    }

    private updateSheetTime(message:IFunkfeuerMessage) {
        if (message.sheetTime) {
            this.sheetTime = message.sheetTime;
        }
    }

    private checkForUpdate(message:IFunkfeuerMessage) {
        if (!message.lastUpdateTimestamp) {
            return;
        }
        if (this.lastUpdateTimestamp === 0) {
            this.lastUpdateTimestamp = message.lastUpdateTimestamp;
            return;
        }
        if (message.lastUpdateTimestamp !== this.lastUpdateTimestamp) {
            this.lastUpdateTimestamp = message.lastUpdateTimestamp;
            this.playerMessage.emit(OnSourcesChanged)
        }
    }

    private startUdpListener(port: number) {
        if (this.socket !== null) {
            return;
        }
        if (this.socket === null) {
            this.socket = dgram.createSocket('udp4');
        }
        this.socket.on('message', (msg) => {
            if (this.state === PlayerState.StartPlaying) {
                this.state = PlayerState.Playing;
            }
            let message:IFunkfeuerMessage = JSON.parse(msg.toString());
            this.updateSheetTime(message);
            this.checkForUpdate(message);
            this.playerMessage.emit(exports.OnPlayerMessageEvent, message);
        });
        this.socket.bind(port);
        console.log(`listen udp messages on port ${port}`);
    }

    private stopUdpListener() {
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

    private updateDocumentInfo(): Promise<ISheetInfo> {
        return new Promise((resolve, reject) => {
            const config = new Config();
            config.info = true;
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
            this.sheetInfo = sourceMap as ISheetInfo;
            this.sheetInfo.mainDocument = this.currentFile as string;
            return this.sheetInfo;
        });
    }

    async play(sheetPath: string): Promise<void> {
        this.currentFile = sheetPath;
        await this.updateDocumentInfo();
        this.notifyDocumentWarningsIfAny();
        return this._startPlayer(sheetPath);
    }

    pause(): Promise<void> {
        this.state = PlayerState.Pausing;
        return this.stop();
    }

    private async _startPlayer(sheetPath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (this.isPlaying) {
                await this.stop(); // restart
            }
            const nextFreePort = await getFreeUdpPort();
            const config = new Config();
            config.funkfeuer = true;
            config.watch = true;
            config.port = nextFreePort;
            config.sheetPath = sheetPath;
            if (this.state === PlayerState.Paused) {
                config.begin = this.sheetTime;
            } else {
                config.begin = this.begin;
            }
            let cmd = `${this.wmPlayerPath} ${this.configToString(config)}`;
            this.state = PlayerState.StartPlaying;
            this.process = this._execute(cmd, (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    reject(stderr);
                    this.process = null;
                    this.currentFile = null;
                    this.stopUdpListener();
                    this.state = PlayerState.Stopped;
                    return;
                }
                resolve();
                this.stopUdpListener();
                this.process = null;
                if (this.state === PlayerState.Playing) {
                    this.state = PlayerState.Stopped;
                }
            });
            this.startUdpListener(config.port);
        });
    }

    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.state === PlayerState.Paused) {
                this.state = PlayerState.Stopped;
            }
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.stopUdpListener();
            if (this.state !== PlayerState.Pausing) {
                this.state = PlayerState.Stopping;
            }
            killProcess(this.process as ChildProcess);
            let waitUntilEnd = () => {
                if (!this.isPlaying) {
                    resolve();
                    this.state = this.state === PlayerState.Stopping ? PlayerState.Stopped : PlayerState.Paused;
                    return;
                }
                setTimeout(waitUntilEnd, 100);
            }
            waitUntilEnd();
        });
    }

    notifyDocumentWarningsIfAny() {
        if (!this.sheetInfo || !this.sheetInfo.warnings || this.sheetInfo.warnings.length === 0) {
            return;
        }
        for (let warning of this.sheetInfo.warnings) {
            vscode.window.showWarningMessage(warning.message);
        }
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
        if (config.info) {
            options.push('--info');
        }
        if (config.sigintWorkaround) {
            options.push('--win32-sigint-workaround');
        }
        if (config.begin > 0) {
            options.push(`--begin=${config.begin}`);
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