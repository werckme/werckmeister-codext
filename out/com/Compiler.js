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
/**
 * executes the werckmeister compiler: sheetc
 */
const child_process_1 = require("child_process");
const Player_1 = require("./Player");
const extension_1 = require("../extension");
exports.CompilerExecutable = Player_1.IsWindows ? 'sheetc.exe' : 'sheetc';
var CompilerMode;
(function (CompilerMode) {
    CompilerMode["normal"] = "normal";
    CompilerMode["json"] = "json";
    CompilerMode["validate"] = "validate";
})(CompilerMode = exports.CompilerMode || (exports.CompilerMode = {}));
let _lastVersionCheckSucceed = false;
class Params {
    constructor(sheetPath = "", mode = CompilerMode.normal) {
        this.sheetPath = sheetPath;
        this.mode = mode;
        this.getVersion = false;
    }
}
exports.Params = Params;
;
class VersionMismatchException extends Error {
    constructor(currentVersion, minimumVersion = extension_1.WMMinimumWerckmeisterCompilerVersion) {
        super(`minimum required Werckmeister version is ${minimumVersion}`);
        this.currentVersion = currentVersion;
        this.minimumVersion = minimumVersion;
    }
}
exports.VersionMismatchException = VersionMismatchException;
function werckmeisterVersionToNumber(version) {
    version = version.replace(/\./g, "");
    return Number.parseInt(version);
}
exports.werckmeisterVersionToNumber = werckmeisterVersionToNumber;
class ValidationResult {
    constructor(source) {
        this.source = source;
    }
    get hasErrors() {
        return !!this.errorResult.errorMessage;
    }
    get validationResult() {
        return this.source;
    }
    get errorResult() {
        return this.source;
    }
}
exports.ValidationResult = ValidationResult;
class Compiler {
    constructor() {
        this._pid = 0;
        this.process = null;
    }
    get wmCompilerPath() {
        return Player_1.toWMBINPath(exports.CompilerExecutable);
    }
    getVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new Params();
            params.getVersion = true;
            let version = yield this.executeCompiler(params);
            version = version.split("@")[0];
            return version;
        });
    }
    checkVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            if (_lastVersionCheckSucceed) {
                return;
            }
            const strVersion = yield this.getVersion();
            const version = werckmeisterVersionToNumber(strVersion);
            const minVersion = werckmeisterVersionToNumber(extension_1.WMMinimumWerckmeisterCompilerVersion);
            if (version >= minVersion) {
                _lastVersionCheckSucceed = true;
                return;
            }
            throw new VersionMismatchException(strVersion);
        });
    }
    _execute(cmd, callback) {
        return child_process_1.exec(cmd, callback);
    }
    executeCompiler(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let cmd = `${this.wmCompilerPath} ${this.paramsToString(params)}`;
                this.process = this._execute(cmd, (err, stdout, stderr) => {
                    if (!!err) {
                        this.process = null;
                        if (params.mode !== CompilerMode.validate || !stdout) {
                            reject(stderr);
                            return;
                        }
                        resolve(stdout);
                        return;
                    }
                    resolve(stdout.toString());
                    this.process = null;
                });
            });
        });
    }
    compile(sheetPath, mode = CompilerMode.normal) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkVersion();
            const params = new Params(sheetPath, mode);
            return this.executeCompiler(params);
        });
    }
    validate(sheetPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const str = yield this.compile(sheetPath, CompilerMode.validate);
            const obj = JSON.parse(str);
            return new ValidationResult(obj);
        });
    }
    paramsToString(params) {
        if (params.getVersion) {
            return "--version";
        }
        if (!params.sheetPath) {
            throw new Error('missing sheet path');
        }
        let options = [
            params.sheetPath,
            `--mode=${params.mode.toString()}`
        ];
        return options.join(" ");
    }
}
exports.Compiler = Compiler;
//# sourceMappingURL=Compiler.js.map