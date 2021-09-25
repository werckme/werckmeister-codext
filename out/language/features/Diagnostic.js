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
var DiagnosticType;
(function (DiagnosticType) {
    DiagnosticType[DiagnosticType["waning"] = 0] = "waning";
    DiagnosticType[DiagnosticType["error"] = 1] = "error";
})(DiagnosticType || (DiagnosticType = {}));
;
function createDiagnostic(message) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = yield Tools_1.findDocument(message.sourceFile);
        if (!document) {
            return null;
        }
        const positon = message.positionBegin;
        if (positon === undefined) {
            return null;
        }
        const beginPosition = document.positionAt(positon);
        let range = document.getWordRangeAtPosition(beginPosition);
        if (!range) {
            range = new vscode.Range(beginPosition, beginPosition.translate(0, FallbackCharactersRange));
        }
        const severity = message.type === DiagnosticType.error ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
        const result = new vscode.Diagnostic(range, message.message, severity);
        return result;
    });
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
            yield this.updateDiagnostics(diagnosticMap, result);
            diagnosticMap.forEach((diags, file) => {
                this.diagnosticCollection.set(vscode.Uri.parse(file), diags);
            });
            return result;
        });
    }
    updateDiagnostics(diagnosticMap, validation) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = [];
            if (validation.hasErrors && !!validation.errorResult.sourceFile) {
                messages.push({
                    sourceFile: validation.errorResult.sourceFile,
                    message: validation.errorResult.errorMessage,
                    positionBegin: validation.errorResult.positionBegin,
                    type: DiagnosticType.error
                });
            }
            if (!validation.hasErrors && validation.validationResult.warnings) {
                for (var waning of validation.validationResult.warnings) {
                    if (!waning.sourceFile) {
                        continue;
                    }
                    messages.push({
                        sourceFile: waning.sourceFile,
                        message: waning.message,
                        positionBegin: waning.positionBegin,
                        type: DiagnosticType.waning
                    });
                }
            }
            for (const message of messages) {
                let canonicalFile = vscode.Uri.file(message.sourceFile).toString();
                let diagnostics = diagnosticMap.get(canonicalFile);
                if (!diagnostics) {
                    diagnostics = [];
                }
                const diagnose = yield createDiagnostic(message);
                if (!diagnose) {
                    return;
                }
                diagnostics.push(diagnose);
                diagnosticMap.set(canonicalFile, diagnostics);
            }
        });
    }
}
exports.Diagnostic = Diagnostic;
//# sourceMappingURL=Diagnostic.js.map