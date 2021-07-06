import { FileInfo, IFileSystemInspector, Path } from "@werckmeister/language-features";
import * as path from 'path';
import * as fs from 'fs';

export class FileSystemInspector implements IFileSystemInspector {
    public async ls(dir: Path): Promise<FileInfo[]> {
        if (!fs.existsSync(dir)) {
            return [];
        }
        const contents = fs.readdirSync(dir);
        return contents.map(p => {
            const stats = fs.statSync(path.join(dir, p));
            return {
                name: p,
                isDirectory: stats.isDirectory()
            };
        });
    }
    public async getParentPath(path_: any): Promise<Path> {
        const parentPath = path.dirname(path_);
        return parentPath + path.sep;
    }
}