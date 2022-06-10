import { getPlayer } from '../com/Player';
import { Connection, ConnectionState, getVstConnectionProvider, VstConnectionTreeItem } from '../com/VstConnectionsProvider';
import { ACommand } from './ACommand';


export class ConnectToVst extends ACommand {
    async execute(...args: any[]): Promise<void> {
        const treeItem:VstConnectionTreeItem = args[0][0];
        const player = getPlayer();
        await player.connectToVst(treeItem.connection.port);
        treeItem.connection.state = ConnectionState.Connected;
        getVstConnectionProvider().refresh();
    }

}