import { FileInfo, IFileSystemInspector, Path } from "@werckmeister/language-features";

export class FileSystemInspector implements IFileSystemInspector {
    public async ls(path: Path): Promise<FileInfo[]> {
        return [];
    }
    public async getParentPath(path: any): Promise<Path> {
        return "";
    }
}