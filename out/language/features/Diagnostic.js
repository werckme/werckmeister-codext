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
const Compiler_1 = require("../../com/Compiler");
const vscode = require("vscode");
const Tools_1 = require("../../com/Tools");
const extension_1 = require("../../extension");
const FallbackCharactersRange = 5;
var DiagnoseState;
(function (DiagnoseState) {
    DiagnoseState[DiagnoseState["IsValid"] = 0] = "IsValid";
    DiagnoseState[DiagnoseState["HasErrors"] = 1] = "HasErrors";
})(DiagnoseState = exports.DiagnoseState || (exports.DiagnoseState = {}));
function createError(error) {
    const document = Tools_1.findDocument(error.sourceFile);
    if (!document) {
        return null;
    }
    const beginPosition = document.positionAt(error.positionBegin);
    let range = document.getWordRangeAtPosition(beginPosition);
    if (!range) {
        range = new vscode.Range(beginPosition, beginPosition.translate(0, FallbackCharactersRange));
    }
    const result = new vscode.Diagnostic(range, error.errorMessage, vscode.DiagnosticSeverity.Error);
    return result;
}
class Diagnostic {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection(extension_1.WMDiagnosticCollectionName);
    }
    update(sheetPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const compiler = new Compiler_1.Compiler();
            const result = yield compiler.validate(sheetPath);
            this.diagnosticCollection.clear();
            let diagnosticMap = new Map();
            this.updateDiagnostics(diagnosticMap, result);
            diagnosticMap.forEach((diags, file) => {
                this.diagnosticCollection.set(vscode.Uri.parse(file), diags);
            });
            return result.isError ? DiagnoseState.HasErrors : DiagnoseState.IsValid;
        });
    }
    updateDiagnostics(diagnosticMap, validation) {
        if (!validation.isError || !validation.errorResult.sourceFile) {
            return;
        }
        const error = validation.errorResult;
        let canonicalFile = vscode.Uri.file(validation.errorResult.sourceFile).toString();
        let diagnostics = diagnosticMap.get(canonicalFile);
        if (!diagnostics) {
            diagnostics = [];
        }
        const diagnose = createError(error);
        if (!diagnose) {
            return;
        }
        diagnostics.push(diagnose);
        diagnosticMap.set(canonicalFile, diagnostics);
    }
}
exports.Diagnostic = Diagnostic;
//# sourceMappingURL=Diagnostic.js.map