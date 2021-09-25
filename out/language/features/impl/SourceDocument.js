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
class SourceDocument {
    constructor(document) {
        this.document = document;
    }
    getRange(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const range = new vscode.Range(new vscode.Position(from.line, from.col), new vscode.Position(to.line, to.col));
            const text = this.document.getText(range);
            return text;
        });
    }
    getLine(lineNr) {
        return __awaiter(this, void 0, void 0, function* () {
            const line = this.document.lineAt(lineNr);
            return line.text;
        });
    }
    getAbsolutePath() {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.document.uri.fsPath;
            return file;
        });
    }
}
exports.SourceDocument = SourceDocument;
class ActiveSourceDocument extends SourceDocument {
    constructor(document, position) {
        super(document);
        this.position = position;
    }
    getCursor() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                line: this.position.line,
                col: this.position.character
            };
        });
    }
}
exports.ActiveSourceDocument = ActiveSourceDocument;
//# sourceMappingURL=SourceDocument.js.map