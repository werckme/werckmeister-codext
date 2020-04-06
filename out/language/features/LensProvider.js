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
const vscode = require("vscode");
const Compiler_1 = require("../../com/Compiler");
const Play_1 = require("../../commands/Play");
const Tools_1 = require("../../com/Tools");
const extension_1 = require("../../extension");
class BarposCommand {
    constructor(quarterPos) {
        this.title = "";
        this.command = "";
        this.title = quarterPos.toString();
        this.command = extension_1.WMPlayFromPosition;
        this.arguments = [quarterPos.toString()];
        this.tooltip = "playback from here";
    }
}
function findSourceId(document, analyzeResult) {
    return analyzeResult.validationResult.sources
        .filter(x => Tools_1.isSamePath(x.path, document.fileName))[0].sourceId;
}
function getBarPosLenses(document, sourceId, analyzeResult) {
    const result = [];
    let currentLine = -1;
    for (const barPos of analyzeResult.barEvents) {
        if (barPos.sourceId !== sourceId) {
            continue;
        }
        const docPos = document.positionAt(barPos.positionBegin);
        if (docPos.line === currentLine) {
            // just one per line
            continue;
        }
        currentLine = docPos.line;
        const range = new vscode.Range(docPos, docPos.translate(0, 1));
        if (!range) {
            continue;
        }
        // get the previous bar
        const quarterPos = Math.max(barPos.quarterPosition - barPos.barLength, 0);
        var lens = new vscode.CodeLens(range, new BarposCommand(quarterPos));
        result.push(lens);
    }
    return result;
}
class LensProvider {
    provideCodeLenses(document, token) {
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            if (!Play_1.isSheetFile(document.fileName)) {
                resolve([]);
                return;
            }
            const compiler = new Compiler_1.Compiler();
            const analyzeResult = yield compiler.analyze(document.fileName);
            if (analyzeResult.hasErrors) {
                resolve([]);
                return;
            }
            const sourceId = findSourceId(document, analyzeResult);
            const lenses = getBarPosLenses(document, sourceId, analyzeResult);
            resolve(lenses);
        }));
    }
}
exports.LensProvider = LensProvider;
//# sourceMappingURL=LensProvider.js.map