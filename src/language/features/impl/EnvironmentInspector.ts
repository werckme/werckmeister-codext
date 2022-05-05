import { IEnvironmentInspector, MidiDeviceInfo } from "@werckmeister/language-features/IEnvironmentInspector";
import { getPlayer } from "../../../com/Player";
import { EOL } from 'os';

export class EnvironmentInspector implements IEnvironmentInspector {
    public async getMidiOutputDevices(): Promise<MidiDeviceInfo[]> {
        try {
            const player = getPlayer();
            const devicesStr = await player.listDevices();
            const devices = devicesStr.split(EOL);
            return devices
                .filter(line => !!line && line.trim().length > 0)
                .map(line => (line.match(/^(\d+):\s*(.*)$/) || []))
                .map(match => ({
                    name: match[2],
                    id: match[1]
                }))
                .filter(x => !!x.id);
        } catch {
            return [];
        }
    }
}