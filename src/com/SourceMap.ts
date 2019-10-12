export interface SourceInfo {
    sourceId: number;
    path: string;
}
export interface ISourceMap {
    sources: Array<SourceInfo>;
}

export const EmptySourceMap = {sources:[]};