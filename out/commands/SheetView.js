"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ACommand_1 = require("./ACommand");
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
class SheetView extends ACommand_1.ACommand {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const panel = vscode.window.createWebviewPanel('werckmeister.sheetview', // Identifies the type of the webview. Used internally
            'Sheet View', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {} // Webview options. More on these later.
            );
            let onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'SheetView', 'SheetView.html'));
            fs.readFile(onDiskPath.path, 'utf8', function (err, data) {
                panel.webview.html = data;
            });
        });
    }
}
exports.SheetView = SheetView;
//# sourceMappingURL=SheetView.js.map