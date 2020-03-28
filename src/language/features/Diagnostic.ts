import { Compiler, ValidationResult, IValidationErrorResult } from "../../com/Compiler";
import * as vscode from 'vscode';
import { findDocument } from "../../com/Tools";
import { WMDiagnosticCollectionName } from "../../extension";

const FallbackCharactersRange = 5;


export enum DiagnoseState {
    IsValid,
    HasErrors
}

function createError(error: IValidationErrorResult): vscode.Diagnostic|null {
    const document = findDocument(error.sourceFile);
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

export class Diagnostic {
    diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection(WMDiagnosticCollectionName);

    async update(sheetPath: string): Promise<DiagnoseState> {
        const compiler = new Compiler();
        const result = await compiler.validate(sheetPath);
        this.diagnosticCollection.clear();
        let diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();
        this.updateDiagnostics(diagnosticMap, result);
        diagnosticMap.forEach((diags, file) => {
            this.diagnosticCollection.set(vscode.Uri.parse(file), diags);
        });
        return result.isError ? DiagnoseState.HasErrors : DiagnoseState.IsValid;
    }

    private updateDiagnostics(diagnosticMap: Map<string, vscode.Diagnostic[]>, validation: ValidationResult): void {
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