import { getPlayer } from '../com/Player';
import { ConnectionState, getVstConnectionProvider, VstConnectionTreeItem } from '../com/VstConnectionsProvider';
import { ACommand } from './ACommand';


export class CloseVstConnection extends ACommand {
    async execute(...args: any[]): Promise<void> {
        const treeItem:VstConnectionTreeItem = args[0][0];
        const player = getPlayer();
        await player.closeVstConnection();
        treeItem.connection.state = ConnectionState.Open;
        getVstConnectionProvider().refresh();
    }
}