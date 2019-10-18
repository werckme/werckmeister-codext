import { ACommand } from "./ACommand";
import { OnDispose } from "../com/AWebView";
import { PianoView } from "../com/PianoView";

let currentView: PianoView|null = null;

export class ShowPianoView extends ACommand {

	async execute(): Promise<void> {
		if (currentView !== null) {
			return;
		}
		currentView = new PianoView(this.context);
		await currentView.createPanel();
		currentView.onLifecycleEvent.on(OnDispose, ()=> {
			currentView = null;
		});
	}
}