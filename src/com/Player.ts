/**
 * exceutes the werckmeister player: sheetp
 */

import { exec, spawn, ChildProcess, ExecException } from 'child_process';
import * as dgram from 'dgram';
import * as EventEmitter from 'events';
import { ISheetInfo, IWarning } from './SheetInfo';
import * as vscode from 'vscode';
import * as path from 'path';
import * as _ from "lodash";
import { reject } from 'lodash';

const freeUdpPort = require('udp-free-port');
export const IsWindows:boolean = process.platform === 'win32';
export const PlayerExecutable = IsWindows ? 'sheetp.exe' : 'sheetp';

export interface IFunkfeuerMessage {
    pid: number;
    sheetTime: number;
    lastUpdateTimestamp: number;
    sheetEventInfos: any[];
}

export function werckmeisterWorkingDirectory() {
    const settings = vscode.workspace.getConfiguration('werckmeister');
    const strPath = settings.werckmeisterBinaryDirectory as string;
    if (!strPath) {
        return "";
    }
    return strPath;
}

export function toWMBINPath(executable: string) {
    return path.join(werckmeisterWorkingDirectory(), executable);
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
    private _pid: number = 0;
    private _state: PlayerState = PlayerState.Stopped;
    private socket: dgram.Socket|null = null;
    playerMessage: EventEmitter = new EventEmitter();
    private process: ChildProcess|null = null;
    sheetInfo: ISheetInfo|null = null;
    currentFile: string|null = null;
    begin: number = 0;
    private _sheetTime: number = 0;
    private lastUpdateTimestamp = 0;

    get inTransition(): boolean {
        return this.state === PlayerState.StartPlaying
            || this.state === PlayerState.Stopping
            || this.state === PlayerState.Pausing;
    }

    get isStateChangeLocked(): boolean {
        return this.inTransition;
    }

    get wmPlayerPath(): string {
        return toWMBINPath(PlayerExecutable);
    }

    get isPlaying(): boolean {
        return !!this.process;
    }

    get isStopped(): boolean {
        return this.state === PlayerState.Stopped;
    }

    get isPaused(): boolean {
        return this.state === PlayerState.Paused;
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
        this._pid = 0;
        this.lastUpdateTimestamp = 0;
    }
    set state(val: PlayerState) {
        if (this.state === val) {
            return;
        }
        this._state = val;
        if (this._state === PlayerState.Stopped) {
            this.begin = 0;
            this.reset();
        }
        if (this._state === PlayerState.Paused) {
            this._pid = 0;
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
            if (this._pid === 0) {
                this._pid = message.pid;
            }
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
    
    private _execute(cmd:string, args:string[], callback: (err:any, stdout: any, stderr: any)=>void): ChildProcess {
        const newProcess = spawn(cmd, args);
        let stdout = "";
        let stderr = "";
        newProcess.stdout.on('data', (data) => {
            stdout += data;
        });

        newProcess.stderr.on('data', (data) => {
            stderr += data
        });

        newProcess.on('close', (code) => {
            const hasError = code !== 0;
            callback(hasError ? {} : null, stdout, stderr);
        });

        return newProcess;
    }

    public listDevices(): Promise<string> {
        return new Promise((resolve, reject) => {
            this._execute(this.wmPlayerPath, ["--list"], (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    reject(err);
                    return;
                }
                try {            
                    resolve(stdout);
                } catch(ex)  {
                    reject(ex);
                }
            });
        });
    }

    private updateDocumentInfo(): Promise<ISheetInfo> {
        return new Promise((resolve, reject) => {
            const config = new Config();
            config.info = true;
            config.sheetPath = this.currentFile as string;
            this._execute(this.wmPlayerPath, this.configToArgs(config), (err:any, stdout: any, stderr: any) => {
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
        if (this.isPlaying || this.isStateChangeLocked) {
            return;
        }
        const oldState = this.state;
        const config = new Config();
        if (oldState === PlayerState.Paused) {
            config.begin = this.sheetTime;
        } else {
            config.begin = this.begin;
        }
        this.currentFile = sheetPath;
        await this.updateDocumentInfo();
        this.notifyDocumentWarningsIfAny();
        const promise = this._startPlayer(sheetPath, config);
        this.state = PlayerState.StartPlaying;
        return promise;
    }

    async pause(): Promise<void> {
        if (this.isStateChangeLocked) {
            return;
        }
        this.state = PlayerState.Pausing;
        return new Promise((resolve, reject) => {
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.stopUdpListener();
            this.killProcess(this.process as ChildProcess,  this._pid);
            let waitUntilEnd = () => {
                if (!this.isPlaying) {
                    resolve();
                    this.state = PlayerState.Paused;
                    return;
                }
                setTimeout(waitUntilEnd, 100);
            }
            waitUntilEnd();
        });
    }

    killProcessWindowsWorkaround(pid: number) {
        if (!pid) {
            return;
        }
        const killPath = toWMBINPath(`win32-kill-sheetp-process.exe`)
        this._execute(killPath, [pid.toString()], (err:any, stdout: any, stderr: any) => {
            if (!!err) {
                vscode.window.showErrorMessage(stderr.toString());
            }
        });
    }

    killProcess(childProcess:ChildProcess, pid: number) {
        if (IsWindows) {
            this.killProcessWindowsWorkaround(pid);
            return;
        }
        childProcess!.kill("SIGINT");
    }
    

    private async _startPlayer(sheetPath: string, config: Config): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const nextFreePort = await getFreeUdpPort();
            config.funkfeuer = true;
            config.watch = true;
            config.port = nextFreePort;
            config.sheetPath = sheetPath;
            this.process = this._execute(this.wmPlayerPath, this.configToArgs(config), (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    // due to a bug in the player it may happen that a part of
                    // the error message is written to stdout
                    const errorMessage = `${stderr} ${stdout}`;
                    reject(errorMessage);
                    this.process = null;
                    this.currentFile = null;
                    this.stopUdpListener();
                    this.state = PlayerState.Stopped;
                    return;
                }
                resolve();
                this.stopUdpListener();
                this.process = null;
                if (this.state === PlayerState.Playing || this.state === PlayerState.StartPlaying) {
                    this.state = PlayerState.Stopped;
                }
            });
            this.startUdpListener(config.port);
        });
    }

    async stop(): Promise<void> {
        if (this.isStopped || this.isStateChangeLocked) {
            return;
        }
        if (this.isPaused) {
            this.state = PlayerState.Stopped;
            return;
        }
        this.state = PlayerState.Stopping;
        return new Promise((resolve, reject) => {
            this.stopUdpListener();
            this.killProcess(this.process as ChildProcess,  this._pid);
            let waitUntilEnd = () => { // will be stopped after _startPlayer process exits
                if (!this.isStopped) {
                    resolve();
                    this.state = PlayerState.Stopped;
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
        return this.configToArgs(config).join(" ");
    }

    private configToArgs(config: Config) {
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
        return options;
    }
}

let globalPlayer: Player;

export function getPlayer(): Player {
    if (!globalPlayer) {
        globalPlayer = new Player();
    }
    return globalPlayer;
}