"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
class FileSystemInspector {
    resolve(basePath, path_) {
        return __awaiter(this, void 0, void 0, function* () {
            return path.resolve(basePath, path_);
        });
    }
    ls(dir) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    getParentPath(path_) {
        return __awaiter(this, void 0, void 0, function* () {
            const parentPath = path.dirname(path_);
            return parentPath + path.sep;
        });
    }
}
exports.FileSystemInspector = FileSystemInspector;
//# sourceMappingURL=FileSystemInspector.js.map