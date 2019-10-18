import { ACommand } from "./ACommand";
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Player, getPlayer, OnPlayerMessageEvent, OnPlayerStateChanged, PlayerState } from "../com/Player";
import { SheetView as SheetWebView } from '../com/SheetView';
import { OnDispose } from "../com/AWebView";

let currentView: SheetWebView|null = null;

export class SheetView extends ACommand {

	async execute(): Promise<void> {
		if (currentView !== null) {
			return;
		}
		currentView = new SheetWebView(this.context);
		await currentView.createPanel();
		currentView.onLifecycleEvent.on(OnDispose, ()=> {
			currentView = null;
		});
	}
}