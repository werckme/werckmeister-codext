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
const path_1 = require("path");
const Player_1 = require("../com/Player");
class Stop extends ACommand_1.ACommand {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            let player = Player_1.getPlayer();
            let currentFile = player.currentFile;
            player.stop()
                .then(() => { })
                .catch((ex) => {
                vscode.window.showErrorMessage(ex);
            });
            if (!!currentFile) {
                vscode.window.showInformationMessage(`Stopped: ${path_1.basename(currentFile)}`);
            }
        });
    }
}
exports.Stop = Stop;
//# sourceMappingURL=Stop.js.map