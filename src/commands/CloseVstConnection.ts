import * as vscode from 'vscode';
import { Play } from "./Play";
import { getPlayer } from '../com/Player';

let _lastPosition = 0;

export class CloseVstConnection extends Play {
    async execute(): Promise<void> {
        const player = getPlayer();
        player.closeVstConnection();
    }

}