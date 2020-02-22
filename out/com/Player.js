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
exports.IsWindows = process.platform === 'win32';
exports.PlayerExecutable = exports.IsWindows ? 'sheetp.exe' : 'sheetp';
function playerWorkingDirectory() {
    const settings = vscode.workspace.getConfiguration('werckmeister');
    const strPath = settings.werckmeisterBinaryDirectory;
    if (!strPath) {
        return "";
    }
    return strPath;
}
function toWMBINPath(executable) {
    return path.join(playerWorkingDirectory(), executable);
}
exports.toWMBINPath = toWMBINPath;
function killProcess(childProcess) {
    if (exports.IsWindows) {
        fs.unlinkSync(toWMBINPath(Win32SigintWorkaroundFile));
        return;
    }
    childProcess.kill("SIGINT");
}
class Config {
    constructor() {
        this.watch = false;
        this.funkfeuer = false;
        this.info = false;
        this.port = 8080;
        this.begin = 0;
        this.sheetPath = "";
        this.sigintWorkaround = exports.IsWindows ? true : false;
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
exports.OnSourcesChanged = 'OnSourcesChanged';
var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["Undefined"] = 0] = "Undefined";
    PlayerState[PlayerState["StartPlaying"] = 1] = "StartPlaying";
    PlayerState[PlayerState["Playing"] = 2] = "Playing";
    PlayerState[PlayerState["Stopped"] = 3] = "Stopped";
    PlayerState[PlayerState["Stopping"] = 4] = "Stopping";
    PlayerState[PlayerState["Pausing"] = 5] = "Pausing";
    PlayerState[PlayerState["Paused"] = 6] = "Paused";
})(PlayerState = exports.PlayerState || (exports.PlayerState = {}));
class Player {
    constructor() {
        this._state = PlayerState.Stopped;
        this.socket = null;
        this.playerMessage = new EventEmitter();
        this.process = null;
        this.sheetInfo = null;
        this.currentFile = null;
        this.begin = 0;
        this._sheetTime = 0;
        this.lastUpdateTimestamp = 0;
    }
    get wmPlayerPath() {
        return toWMBINPath(exports.PlayerExecutable);
    }
    get isPlaying() {
        return !!this.process;
    }
    get sheetTime() {
        return this._sheetTime;
    }
    set sheetTime(val) {
        this._sheetTime = val;
        if (val === 0) {
            this.playerMessage.emit(exports.OnPlayerMessageEvent, { sheetTime: 0 });
        }
    }
    get state() {
        return this._state;
    }
    reset() {
        this.currentFile = null;
        this.sheetTime = 0;
        this.lastUpdateTimestamp = 0;
    }
    set state(val) {
        if (this.state === val) {
            return;
        }
        console.log(PlayerState[val]);
        this._state = val;
        if (this._state === PlayerState.Stopped) {
            this.reset();
        }
        this.playerMessage.emit(exports.OnPlayerStateChanged, this._state);
    }
    updateSheetTime(message) {
        if (message.sheetTime) {
            this.sheetTime = message.sheetTime;
        }
    }
    checkForUpdate(message) {
        if (!message.lastUpdateTimestamp) {
            return;
        }
        if (this.lastUpdateTimestamp === 0) {
            this.lastUpdateTimestamp = message.lastUpdateTimestamp;
            return;
        }
        if (message.lastUpdateTimestamp !== this.lastUpdateTimestamp) {
            this.lastUpdateTimestamp = message.lastUpdateTimestamp;
            this.playerMessage.emit(exports.OnSourcesChanged);
        }
    }
    startUdpListener(port) {
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
            let message = JSON.parse(msg.toString());
            this.updateSheetTime(message);
            this.checkForUpdate(message);
            this.playerMessage.emit(exports.OnPlayerMessageEvent, message);
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
    updateDocumentInfo() {
        return new Promise((resolve, reject) => {
            const config = new Config();
            config.info = true;
            config.sheetPath = this.currentFile;
            let cmd = `${this.wmPlayerPath} ${this.configToString(config)}`;
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
            this.sheetInfo = sourceMap;
            this.sheetInfo.mainDocument = this.currentFile;
            return this.sheetInfo;
        });
    }
    play(sheetPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentFile = sheetPath;
            yield this.updateDocumentInfo();
            this.notifyDocumentWarningsIfAny();
            return this._startPlayer(sheetPath);
        });
    }
    pause() {
        this.state = PlayerState.Pausing;
        return this.stop();
    }
    _startPlayer(sheetPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (this.isPlaying) {
                    yield this.stop(); // restart
                }
                const nextFreePort = yield getFreeUdpPort();
                const config = new Config();
                config.funkfeuer = true;
                config.watch = true;
                config.port = nextFreePort;
                config.sheetPath = sheetPath;
                if (this.state === PlayerState.Paused) {
                    config.begin = this.sheetTime;
                }
                else {
                    config.begin = this.begin;
                }
                let cmd = `${this.wmPlayerPath} ${this.configToString(config)}`;
                this.state = PlayerState.StartPlaying;
                this.process = this._execute(cmd, (err, stdout, stderr) => {
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
            }));
        });
    }
    stop() {
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
            killProcess(this.process);
            let waitUntilEnd = () => {
                if (!this.isPlaying) {
                    resolve();
                    this.state = this.state === PlayerState.Stopping ? PlayerState.Stopped : PlayerState.Paused;
                    return;
                }
                setTimeout(waitUntilEnd, 100);
            };
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