import * as vscode from 'vscode';
import { Play } from "./Play";
import { getPlayer } from '../com/Player';

let _lastPosition = 0;

export class PlayFromPosition extends Play {

    get startPositionArg(): number | undefined {
        if (!this.args || this.args.length === 0) {
            return undefined;
        }
        const quarters = Number.parseFloat(this.args[0]);
        if (Number.isNaN(quarters)) {
            return undefined;
        }
        return quarters;
    }

    async getPositionFromInput(): Promise<number|undefined> {
        const input = await vscode.window.showInputBox({value: _lastPosition.toString(), prompt: "start position in quarters"});
        if (input === undefined) {
            return;
        }
        const quarters = Number.parseFloat(input);
        if (Number.isNaN(quarters)) {
            return undefined;
        }
        return quarters;
    }

    async execute(): Promise<void> {
        let quarters = this.startPositionArg;
        if (quarters === undefined) {
            quarters = await this.getPositionFromInput();
        }
        if (quarters === undefined) {
            return;
        }
        _lastPosition = quarters;
        const player = getPlayer();
        await player.stop();
        player.begin = quarters;
        return super.execute();
    }

}