import { ACommand } from "./ACommand";
import { OnDispose } from "../com/AWebView";
import { TransportView } from "../com/TransportView";


export class ShowTransportView extends ACommand {

	async execute(): Promise<void> {
		const view = new TransportView(this.context);
		await view.createPanel();
	}
}