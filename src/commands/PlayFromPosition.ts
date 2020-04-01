import * as vscode from 'vscode';
import { Play } from "./Play";
import { getPlayer } from '../com/Player';

let _lastPosition = 0;

export class PlayFromPosition extends Play {
    async execute(): Promise<void> {
        const input = await vscode.window.showInputBox({value: _lastPosition.toString(), prompt: "start position in quarters"});
        if (input === undefined) {
            return;
        }
        const quarters = Number.parseFloat(input);
        if (Number.isNaN(quarters)) {
            return;
        }
        _lastPosition = quarters;
        const player = getPlayer();
        await player.stop();
        player.begin = quarters;
        return super.execute();
    }

}