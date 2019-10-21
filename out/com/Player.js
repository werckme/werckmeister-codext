"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const dgram = require("dgram");
const EventEmitter = require("events");
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const freeUdpPort = require('udp-free-port');
const Win32SigintWorkaroundFile = "keepalive";
const IsWindows = process.platform === 'win32';
function playerWorkingDirectory() {
    const settings = vscode.workspace.getConfiguration('werckmeister');
    const strPath = settings.werckmeisterBinaryDirectory;
    if (!strPath) {
        throw new Error(`missing \"Werckmeister BinaryDirectory\" configuration. (Settings->Extensions->Werckmeister)`);
    }
    return strPath;
}
function toWMBINPath(executable) {
    return path.join(playerWorkingDirectory(), executable);
}
function killProcess(childProcess) {
    if (IsWindows) {
        fs.unlinkSync(toWMBINPath(Win32SigintWorkaroundFile));
        return;
    }
    childProcess.kill("SIGINT");
}
const PlayerExecutable = IsWindows ? 'sheetp.exe' : 'sheetp';
class Config {
    constructor() {
        this.watch = false;
        this.funkfeuer = false;
        this.sourceMap = false;
        this.port = 8080;
        this.sheetPath = "";
        this.sigintWorkaround = IsWindows ? true : false;
    }
}
;
function getFreeUdpPort() {
    return new Promise((resolve, reject) => {
        freeUdpPort((err, port) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(port);
        });
    });
}
exports.OnPlayerMessageEvent = 'OnPlayerMessageEvent';
exports.OnPlayerStateChanged = 'OnPlayerStateChanged';
var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["Undefined"] = 0] = "Undefined";
    PlayerState[PlayerState["Playing"] = 1] = "Playing";
    PlayerState[PlayerState["Stopped"] = 2] = "Stopped";
})(PlayerState = exports.PlayerState || (exports.PlayerState = {}));
class Player {
    constructor() {
        this.socket = null;
        this.playerMessage = new EventEmitter();
        this.process = null;
        this.sourceMap = null;
        this.currentFile = null;
    }
    get wmPlayerPath() {
        return toWMBINPath(PlayerExecutable);
    }
    get isPlaying() {
        return !!this.process;
    }
    startUdpListener(port) {
        if (this.socket !== null) {
            return;
        }
        if (this.socket === null) {
            this.socket = dgram.createSocket('udp4');
        }
        this.socket.on('message', (msg) => {
            let object = JSON.parse(msg.toString());
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
    _execute(cmd, callback) {
        console.log(cmd);
        return child_process_1.exec(cmd, { cwd: playerWorkingDirectory() }, callback);
    }
    updateSourceMap() {
        return new Promise((resolve, reject) => {
            const config = new Config();
            config.sourceMap = true;
            config.sheetPath = this.currentFile;
            let cmd = `${this.wmPlayerPath} ${this.configToString(config)}"`;
            this._execute(cmd, (err, stdout, stderr) => {
                if (!!err) {
                    reject(err);
                    return;
                }
                try {
                    let json = JSON.parse(stdout);
                    resolve(json);
                }
                catch (ex) {
                    reject(ex);
                }
            });
        }).then((sourceMap) => {
            this.sourceMap = sourceMap;
            this.sourceMap.mainDocument = this.currentFile;
            return this.sourceMap;
        });
    }
    play(sheetPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentFile = sheetPath;
            yield this.updateSourceMap();
            return this._startPlayer(sheetPath);
        });
    }
    _startPlayer(sheetPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this.isPlaying) {
                    yield this.stop();
                }
                const nextFreePort = yield getFreeUdpPort();
                const config = new Config();
                config.funkfeuer = true;
                config.watch = true;
                config.port = nextFreePort;
                config.sheetPath = sheetPath;
                let cmd = `${this.wmPlayerPath} ${this.configToString(config)}`;
                setTimeout(this.playerMessage.emit.bind(this.playerMessage, exports.OnPlayerStateChanged, PlayerState.Playing), 10);
                this.process = this._execute(cmd, (err, stdout, stderr) => {
                    if (!!err) {
                        reject(stderr);
                        this.process = null;
                        this.currentFile = null;
                        return;
                    }
                    resolve();
                    this.stopUdpListener();
                    this.process = null;
                    this.currentFile = null;
                });
                this.startUdpListener(config.port);
            }));
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.stopUdpListener();
            killProcess(this.process);
            let waitUntilEnd = () => {
                if (!this.isPlaying) {
                    resolve();
                    this.playerMessage.emit(exports.OnPlayerStateChanged, PlayerState.Stopped);
                    return;
                }
                setTimeout(waitUntilEnd, 100);
            };
            waitUntilEnd();
        });
    }
    configToString(config) {
        if (!config.sheetPath) {
            throw new Error('missing sheet path');
        }
        let options = [
            config.sheetPath,
            '--notime'
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
exports.Player = Player;
let globalPlayer;
function getPlayer() {
    if (!globalPlayer) {
        globalPlayer = new Player();
    }
    return globalPlayer;
}
exports.getPlayer = getPlayer;
//# sourceMappingURL=Player.js.map