export interface ISourceInfo {
    sourceId: number;
    path: string;
}

export interface IWarning {
    message: string;
}

export interface ISheetInfo {
    mainDocument: string;
    duration: number;
    sources: Array<ISourceInfo>;
    warnings: IWarning[];
}

export interface ISheetEventInfo {
    beginPosition: number;
    endPosition: number;
    sourceId: number;
}
