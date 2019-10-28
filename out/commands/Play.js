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
const path = require("path");
let lastSheetFile = null;
class Play extends ACommand_1.ACommand {
    startPlayer(sheetPath) {
        let filename = path_1.basename(sheetPath);
        let player = Player_1.getPlayer();
        player.play(sheetPath)
            .then(() => { })
            .catch((ex) => {
            vscode.window.showErrorMessage(`Werckmeister: ${ex}`);
        });
    }
    isSheetFile(strPath) {
        if (path.extname(strPath) === '.sheet') {
            return true;
        }
        return false;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                if (lastSheetFile !== null) {
                    this.startPlayer(lastSheetFile);
                }
                return;
            }
            let sheetPath = editor.document.fileName;
            if (!this.isSheetFile(sheetPath)) {
                if (lastSheetFile !== null) {
                    this.startPlayer(lastSheetFile);
                }
                return;
            }
            this.startPlayer(sheetPath);
            lastSheetFile = sheetPath;
        });
    }
}
exports.Play = Play;
//# sourceMappingURL=Play.js.map