import * as vscode from "vscode";
import { AnalyzeResult, Compiler } from "../../com/Compiler";
import { isSheetFile } from "../../commands/Play";
import { isSamePath } from "../../com/Tools";
import { WMPlayFromPosition } from "../../extension";

class PlayFromHereCommand implements vscode.Command {
    title: string = "";
    command: string = "";
    tooltip?: string | undefined;
    arguments?: any[] | undefined;
    constructor(quarterPos: number) {
        this.title = `▶ ${quarterPos.toFixed(1)}`;
        this.command = WMPlayFromPosition;
        this.arguments = [quarterPos.toString()];
        this.tooltip = "playback from here";
    }
}

function findSourceId (document: vscode.TextDocument, analyzeResult: AnalyzeResult) {
    return analyzeResult.validationResult.sources
        .filter(x=> isSamePath(x.path, document.fileName))
        [0].sourceId;
}

function getPlayFromHereLenses(document: vscode.TextDocument, sourceId: number, analyzeResult: AnalyzeResult): vscode.CodeLens[] {
    const result: vscode.CodeLens[] = [];
    let currentLine = -1;
    for (const analyzerEvent of analyzeResult.analyzerEvents) {
        if (analyzerEvent.sourceId !== sourceId) {
            continue;
        }
        const docPos = document.positionAt(analyzerEvent.positionBegin);
        if (docPos.line === currentLine) {
            // just one per line
            continue;
        }
        currentLine = docPos.line;
        const range = new vscode.Range(docPos, docPos.translate(0, 1))
        if (!range) {
            continue;
        }
        // get the previous bar
        const quarterPos = Math.max(analyzerEvent.quarterPosition, 0);
        var lens = new vscode.CodeLens(range, new PlayFromHereCommand(quarterPos));
        result.push(lens);
    }
    return result;
}

export class LensProvider implements vscode.CodeLensProvider {
    onDidChangeCodeLenses?: vscode.Event<void> | undefined;

    provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        return new Promise<vscode.CodeLens[]>(async (resolve) => {
            if (!isSheetFile(document.fileName)) {
                resolve([]);
                return;
            }
            const compiler = new Compiler();
            const analyzeResult = await compiler.analyze(document.fileName);
            if (analyzeResult.hasErrors) {
                resolve([]);
                return;
            }
            const sourceId = findSourceId(document, analyzeResult);
            const lenses = getPlayFromHereLenses(document, sourceId, analyzeResult);
            resolve(lenses);
        });
    }

}