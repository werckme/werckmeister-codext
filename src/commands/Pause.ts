import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import { getPlayer, Player } from '../com/Player';


export class Pause extends ACommand {

    async execute(): Promise<void> {
        const player:Player = getPlayer();
        if (!player.isPlaying) {
            return;
        }
        player.pause();
    }
}