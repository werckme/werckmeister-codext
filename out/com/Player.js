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
const WmPlayerPath = "/home/samba/workspace/werckmeister/build/sheetp";
const UDP_PORT = 8080;
const child_process_1 = require("child_process");
const dgram = require("dgram");
const EventEmitter = require("events");
const Config = {
    watch: true
};
exports.OnPlayerMessageEvent = 'OnPlayerMessageEvent';
class Player {
    constructor() {
        this.currentFile = null;
        this.socket = null;
        this.onPlayerMessage = new EventEmitter();
        this.process = null;
    }
    get isPlaying() {
        return !!this.process;
    }
    startUdpListener() {
        if (this.socket === null) {
            this.socket = dgram.createSocket('udp4');
        }
        this.socket.on('message', (msg) => {
            this.onPlayerMessage.emit(exports.OnPlayerMessageEvent, Number.parseFloat(msg.toString()));
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
    play(sheetPath) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (this.isPlaying) {
                yield this.stop();
            }
            let cmd = `${WmPlayerPath} ${sheetPath} ${this.configToString()}`;
            this.currentFile = sheetPath;
            this.process = child_process_1.exec(cmd, (err, stdout, stderr) => {
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
        }));
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.process.kill("SIGINT");
            let waitUntilEnd = () => {
                if (!this.isPlaying) {
                    resolve();
                    return;
                }
                setTimeout(waitUntilEnd, 100);
            };
            waitUntilEnd();
        });
    }
    configToString() {
        let options = [
            `--funkfeuer=localhost:${UDP_PORT}`,
            '--nostdout'
        ];
        if (Config.watch) {
            options.push("--watch");
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