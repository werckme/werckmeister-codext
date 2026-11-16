/**
 * Data the extension host (src/com/InspectorView.ts) sends to the debugger view.
 */

/** debug symbol of a midi event: where it comes from in the werckmeister sources */
export interface DebugSymbol {
    trackId: number;
    eventId: number;
    midiType?: number;
    documentSourceId: number;
    sourcePositionBegin: number;
    sourcePositionEnd: number;
    pitchAlias?: string;
    /** set by the view before it is sent back to the host */
    documentPath?: string;
}

export interface SourceInfo {
    sourceId: number;
    path: string;
}

export interface CompileResult {
    midi: {
        /** the midi file, base64 encoded */
        midiData: string;
        /** in ticks */
        duration: number;
        sources: SourceInfo[];
    };
}

export interface NavigateTo {
    documentPath: string;
    positionOffset: number;
    /** resolved by the view from `documentPath` */
    sourceId?: number;
}

export interface DebuggerMessage {
    sheetTime?: number;
    playerState?: { newState: string };
    duration?: number;
    compiled?: CompileResult;
    sheetPath?: string;
    sheetName?: string;
    debugSymbols?: DebugSymbol[];
    navigateTo?: NavigateTo;
}
