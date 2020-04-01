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
const Player_1 = require("../com/Player");
const path = require("path");
const EditorEventDecorator_1 = require("../com/EditorEventDecorator");
const SheetHistory_1 = require("../com/SheetHistory");
const extension_1 = require("../extension");
const Language_1 = require("../language/Language");
function isSheetFile(strPath) {
    if (path.extname(strPath) === '.sheet') {
        return true;
    }
    return false;
}
exports.isSheetFile = isSheetFile;
class Play extends ACommand_1.ACommand {
    startPlayer(sheetPath) {
        let player = Player_1.getPlayer();
        player.play(sheetPath)
            .then(() => { })
            .catch((ex) => {
            vscode.window.showErrorMessage(`failed to execute werckmeister: ${ex}`);
        });
        EditorEventDecorator_1.getEditorEventDecorator();
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const history = SheetHistory_1.getSheetHistory();
            let sheetpath = history.currentFile;
            if (!sheetpath) {
                sheetpath = history.lastPlayedSheetFile;
            }
            if (!sheetpath) {
                vscode.window.showErrorMessage("no sheet file to play");
                return;
            }
            try {
                const diagnose = yield Language_1.getLanguage().features.diagnostic.update(sheetpath);
                if (diagnose.hasErrors) {
                    const sourcefile = diagnose.errorResult.sourceFile || "unkown location";
                    vscode.window.showErrorMessage(` ${sourcefile}: ${diagnose.errorResult.errorMessage}`, 'Ok');
                    return;
                }
                this.startPlayer(sheetpath);
            }
            catch (ex) {
                vscode.window.showErrorMessage(`Failed to execute Werckmeister. 
Make sure that the Werckmeister path was set correctly.
Exception
${ex}
`, "Help").then(() => {
                    vscode.env.openExternal(vscode.Uri.parse(extension_1.WMExternalHelpInstallWerckmeisterExtension));
                });
            }
        });
    }
}
exports.Play = Play;
//# sourceMappingURL=Play.js.map