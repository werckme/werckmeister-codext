const WmPlayerPath = "/home/samba/workspace/werckmeister/build/sheetp";
import { exec, ChildProcess } from 'child_process';

const Config = {
    watch: true
};

export class Player {
    currentFile: string|null = null;
    private process: ChildProcess|null = null;
    get isPlaying(): boolean {
        return !!this.process;
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
        let options = [];
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