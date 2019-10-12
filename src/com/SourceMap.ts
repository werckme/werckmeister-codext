export interface ISourceInfo {
    sourceId: number;
    path: string;
}
export interface ISourceMap {
    mainDocument: string;
    sources: Array<ISourceInfo>;
}
