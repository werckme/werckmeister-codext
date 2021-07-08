import { Compiler, ValidationResult, IValidationErrorResult } from "../../com/Compiler";
import * as vscode from 'vscode';
import { findDocument } from "../../com/Tools";
import { WMDiagnosticCollectionName } from "../../extension";

const FallbackCharactersRange = 5;
enum DiagnosticType { waning, error };
type DiagnosticMessage = {sourceFile: string, message: string, positionBegin: number, type: DiagnosticType};

async function createDiagnostic(message: DiagnosticMessage): Promise<vscode.Diagnostic|null> {
    const document = await findDocument(message.sourceFile);
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
}

export class Diagnostic {
    diagnosticCollection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection(WMDiagnosticCollectionName);

    async update(sheetPath: string): Promise<ValidationResult> {
        const compiler = new Compiler();
        const result = await compiler.validate(sheetPath);
        this.diagnosticCollection.clear();
        let diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();
        await this.updateDiagnostics(diagnosticMap, result);
        diagnosticMap.forEach((diags, file) => {
            this.diagnosticCollection.set(vscode.Uri.parse(file), diags);
        });
        return result;
    }

    private async updateDiagnostics(diagnosticMap: Map<string, vscode.Diagnostic[]>, validation: ValidationResult): Promise<void> {
        const messages: DiagnosticMessage[] = [];
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
            const diagnose = await createDiagnostic(message);
            if (!diagnose) {
                return;
            }
            diagnostics.push(diagnose);
            diagnosticMap.set(canonicalFile, diagnostics);
        }
    }
}