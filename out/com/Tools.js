"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function isSamePath(pathA, pathB) {
    const result = vscode.Uri.file(pathA).toString() === vscode.Uri.file(pathB).toString();
    return result;
}
exports.isSamePath = isSamePath;
function findDocument(filePath) {
    return vscode
        .workspace
        .textDocuments
        .filter(x => isSamePath(x.fileName, filePath))[0];
}
exports.findDocument = findDocument;
//# sourceMappingURL=Tools.js.map