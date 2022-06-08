import * as vscode from 'vscode';
import { Play } from "./Play";
import { getPlayer } from '../com/Player';

let _lastPosition = 0;

export class ConnectToVst extends Play {
    async execute(): Promise<void> {
        const input = await vscode.window.showInputBox({value: _lastPosition.toString(), prompt: "port"});
        if (input === undefined) {
            return;
        }
        const port = Number.parseFloat(input);
        if (Number.isNaN(port)) {
            return;
        }
        const player = getPlayer();
        player.connectToVst(port);
    }

}