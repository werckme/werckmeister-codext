import { getPlayer, PlayerState } from '../com/Player';
import { getVstConnectionProvider, VstConnectionTreeItem } from '../com/VstConnectionsProvider';
import { ACommand } from './ACommand';


export class ConnectToVst extends ACommand {
    async execute(...args: any[]): Promise<void> {
        const treeItem:VstConnectionTreeItem = args[0][0];
        const player = getPlayer();
        if (player.state === PlayerState.ConnectedToVst) {
            await player.closeVstConnection();
        }
        await player.connectToVst(treeItem.connection);
        getVstConnectionProvider().refresh();
    }

}