"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ACommand_1 = require("./ACommand");
const vscode = require("vscode");
class Play extends ACommand_1.ACommand {
    execute() {
        vscode.window.showInformationMessage('Playing!');
    }
}
exports.Play = Play;
//# sourceMappingURL=Play.js.map