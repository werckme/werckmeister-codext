const WmPlayerPath = "/home/samba/workspace/werckmeister/build/sheetp";
import { exec, ChildProcess } from 'child_process';

export class Player {
    currentFile: string|null = null;
    private process: ChildProcess|null = null;
    get isPlaying(): boolean {
        return !!this.process;
    }
    play(sheetPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isPlaying) {
                resolve();
                return;
            }
            let cmd = `${WmPlayerPath} ${sheetPath}`;
            this.currentFile = sheetPath;
            this.process = exec(cmd, (err:any, stdout: any, stderr: any) => {
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
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isPlaying) {
                resolve();
                return;
            }
            this.process!.kill();
            this.process = null;
            this.currentFile = null;
            resolve();
        });
    }
}

let globalPlayer: Player;

export function getPlayer(): Player {
    if (!globalPlayer) {
        globalPlayer = new Player();
    }
    return globalPlayer;
}