import { IEnvironmentInspector, MidiDeviceInfo } from "@werckmeister/language-features/IEnvironmentInspector";
import { getPlayer } from "../../../com/Player";

export class EnvironmentInspector implements IEnvironmentInspector {
    public async getMidiOutputDevices(): Promise<MidiDeviceInfo[]> {
        try {
            const player = getPlayer();
            const devicesStr = await player.listDevices();
            const devices = devicesStr.split('\n');
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