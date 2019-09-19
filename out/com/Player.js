"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WmPlayerPath = "/home/samba/workspace/werckmeister/build/sheetp";
const child_process_1 = require("child_process");
class Player {
    constructor() {
        this.currentFile = null;
        this.process = null;
    }
    get isPlaying() {
        return !!this.process;
    }
    play(sheetPath) {
        return new Promise((resolve, reject) => {
            if (this.isPlaying) {
                resolve();
                return;
            }
            let cmd = `${WmPlayerPath} ${sheetPath}`;
            this.currentFile = sheetPath;
            this.process = child_process_1.exec(cmd, (err, stdout, stderr) => {
                if (!!err) {
                    reject(stderr);
                    return;
                }
                resolve();
                this.process = null;
                this.currentFile = null;
            });
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.process.kill();
            this.process = null;
            this.currentFile = null;
            resolve();
        });
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