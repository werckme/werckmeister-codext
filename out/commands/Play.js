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
const Compiler_1 = require("../com/Compiler");
function isSheetFile(strPath) {
    if (path.extname(strPath) === '.sheet') {
        return true;
    }
    return false;
}
exports.isSheetFile = isSheetFile;
class Play extends ACommand_1.ACommand {
    onError() {
        const document = vscode.workspace.textDocuments[0];
        const diagnosticCollection = vscode.languages.createDiagnosticCollection("werckmeister");
        diagnosticCollection.clear();
        let diagnosticMap = new Map();
        let canonicalFile = vscode.Uri.file(document.fileName).toString();
        let range = new vscode.Range(1, 1, 1, 5);
        let diagnostics = diagnosticMap.get(canonicalFile);
        if (!diagnostics) {
            diagnostics = [];
        }
        diagnostics.push(new vscode.Diagnostic(range, "ACHTUNG!", vscode.DiagnosticSeverity.Error));
        diagnosticMap.set(canonicalFile, diagnostics);
        diagnosticMap.forEach((diags, file) => {
            diagnosticCollection.set(vscode.Uri.parse(file), diags);
        });
    }
    startPlayer(sheetPath) {
        let player = Player_1.getPlayer();
        player.play(sheetPath)
            .then(() => { })
            .catch((ex) => {
            vscode.window.showErrorMessage(`Werckmeister has dectected an error`, "show")
                .then((item) => {
                if (!item) {
                    return;
                }
                if (item === 'show') {
                    vscode.commands.executeCommand(extension_1.WMCommandPlayTerminal);
                }
            });
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
            const compiler = new Compiler_1.Compiler();
            const result = yield compiler.validate(sheetpath);
            if (result.isError) {
                this.onError();
                return;
            }
            this.startPlayer(sheetpath);
        });
    }
}
exports.Play = Play;
//# sourceMappingURL=Play.js.map