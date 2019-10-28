import { ACommand } from "./ACommand";
import { SheetView as SheetWebView } from '../com/SheetView';
import { OnDispose } from "../com/AWebView";
import * as vscode from 'vscode';

let currentView: SheetWebView|null = null;

export class ShowSheetView extends ACommand {

	async execute(): Promise<void> {
		if (currentView !== null) {
			vscode
			return;
		}
		currentView = new SheetWebView(this.context);
		await currentView.createPanel();
		currentView.onLifecycleEvent.on(OnDispose, ()=> {
			currentView = null;
		});
	}
}