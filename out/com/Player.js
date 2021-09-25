"use strict";
/**
 * exceutes the werckmeister player: sheetp
 */
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
const freeUdpPort = require('udp-free-port');
exports.IsWindows = process.platform === 'win32';
exports.PlayerExecutable = exports.IsWindows ? 'sheetp.exe' : 'sheetp';
function werckmeisterWorkingDirectory() {
    const settings = vscode.workspace.getConfiguration('werckmeister');
    const strPath = settings.werckmeisterBinaryDirectory;
    if (!strPath) {
        return "";
    }
    return strPath;
}
exports.werckmeisterWorkingDirectory = werckmeisterWorkingDirectory;
function toWMBINPath(executable) {
    return path.join(werckmeisterWorkingDirectory(), executable);
}
exports.toWMBINPath = toWMBINPath;
function killProcess(childProcess, pid) {
    if (exports.IsWindows) {
        if (!pid) {
            return;
        }
        const cmd = toWMBINPath(`win32-kill-sheetp-process.exe ${pid}`);
        child_process_1.exec(cmd, (err, stdout, stderr) => {
            if (stderr.toString()) {
                vscode.window.showErrorMessage(stderr.toString());
            }
            if (err != null) {
                vscode.window.showInformationMessage(err.message || "");
            }
        });
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
        this._pid = 0;
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
    get inTransition() {
        return this.state === PlayerState.StartPlaying
            || this.state === PlayerState.Stopping
            || this.state === PlayerState.Pausing;
    }
    get isStateChangeLocked() {
        return this.inTransition;
    }
    get wmPlayerPath() {
        return toWMBINPath(exports.PlayerExecutable);
    }
    get isPlaying() {
        return !!this.process;
    }
    get isStopped() {
        return this.state === PlayerState.Stopped;
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
        this._pid = 0;
        this.lastUpdateTimestamp = 0;
    }
    set state(val) {
        console.log(`${PlayerState[this.state]}->${PlayerState[val]}`, this._pid);
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
    stopUdpListener() {
        if (this.socket === null) {
            return;
        }
        this.socket.removeAllListeners();
        this.socket.close();
        this.socket = null;
        console.log('udp listener stopped');
    }
    _execute(cmd, args, callback) {
        const newProcess = child_process_1.spawn(cmd, args);
        let stdout = "";
        let stderr = "";
        newProcess.stdout.on('data', (data) => {
            stdout += data;
        });
        newProcess.stderr.on('data', (data) => {
            stderr += data;
        });
        newProcess.on('close', (code) => {
            const hasError = code !== 0;
            callback(hasError ? {} : null, stdout, stderr);
        });
        return newProcess;
    }
    updateDocumentInfo() {
        return new Promise((resolve, reject) => {
            const config = new Config();
            config.info = true;
            config.sheetPath = this.currentFile;
            this._execute(this.wmPlayerPath, this.configToArgs(config), (err, stdout, stderr) => {
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
            if (this.isPlaying || this.isStateChangeLocked) {
                return;
            }
            const config = new Config();
            if (this.state === PlayerState.Paused) {
                config.begin = this.sheetTime;
            }
            else {
                config.begin = this.begin;
            }
            this.currentFile = sheetPath;
            yield this.updateDocumentInfo();
            this.notifyDocumentWarningsIfAny();
            this.state = PlayerState.StartPlaying;
            return this._startPlayer(sheetPath, config);
        });
    }
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
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
                killProcess(this.process, this._pid);
                let waitUntilEnd = () => {
                    if (!this.isPlaying) {
                        resolve();
                        this.state = PlayerState.Paused;
                        return;
                    }
                    setTimeout(waitUntilEnd, 100);
                };
                waitUntilEnd();
            });
        });
    }
    _startPlayer(sheetPath, config) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const nextFreePort = yield getFreeUdpPort();
                config.funkfeuer = true;
                config.watch = true;
                config.port = nextFreePort;
                config.sheetPath = sheetPath;
                this.process = this._execute(this.wmPlayerPath, this.configToArgs(config), (err, stdout, stderr) => {
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
            }));
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isStopped || this.isStateChangeLocked) {
                return;
            }
            this.state = PlayerState.Stopping;
            return new Promise((resolve, reject) => {
                this.stopUdpListener();
                killProcess(this.process, this._pid);
                let waitUntilEnd = () => {
                    if (!this.isStopped) {
                        resolve();
                        this.state = PlayerState.Stopped;
                        return;
                    }
                    setTimeout(waitUntilEnd, 100);
                };
                waitUntilEnd();
            });
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
        return this.configToArgs(config).join(" ");
    }
    configToArgs(config) {
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
        return options;
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