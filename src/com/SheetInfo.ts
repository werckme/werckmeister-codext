export interface ISourceInfo {
    sourceId: number;
    path: string;
}
export interface ISheetInfo {
    mainDocument: string;
    duration: number;
    sources: Array<ISourceInfo>;
}

export interface ISheetEventInfo {
    beginPosition: number;
    endPosition: number;
    sourceId: number;
}
