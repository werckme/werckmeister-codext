import { ACommand } from "./ACommand";
import { OnDispose } from "../com/AWebView";
import { Debugger } from "../com/Debugger";


export class ShowDebugger extends ACommand {

	async execute(): Promise<void> {
		const view = new Debugger(this.context);
		await view.createPanel();
	}
}