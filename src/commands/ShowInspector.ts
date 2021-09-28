import { ACommand } from "./ACommand";
import { InspectorView } from "../com/InspectorView";


export class ShowInspector extends ACommand {

	async execute(): Promise<void> {
		const view = new InspectorView(this.context);
		await view.createPanel();
	}
}