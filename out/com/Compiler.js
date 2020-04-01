"use strict";
/**
 * executes the werckmeister compiler: sheetc
 */
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
const child_process_1 = require("child_process");
const Player_1 = require("./Player");
exports.CompilerExecutable = Player_1.IsWindows ? 'sheetc.exe' : 'sheetc';
var CompilerMode;
(function (CompilerMode) {
    CompilerMode["normal"] = "normal";
    CompilerMode["json"] = "json";
    CompilerMode["validate"] = "validate";
})(CompilerMode = exports.CompilerMode || (exports.CompilerMode = {}));
class Params {
    constructor(sheetPath, mode = CompilerMode.normal) {
        this.sheetPath = sheetPath;
        this.mode = mode;
    }
}
exports.Params = Params;
;
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
    _execute(cmd, callback) {
        return child_process_1.exec(cmd, callback);
    }
    compile(sheetPath, mode = CompilerMode.normal) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new Params(sheetPath, mode);
            return new Promise((resolve, reject) => {
                let cmd = `${this.wmCompilerPath} ${this.paramsToString(params)}`;
                this.process = this._execute(cmd, (err, stdout, stderr) => {
                    if (!!err) {
                        this.process = null;
                        if (mode !== CompilerMode.validate || !stdout) {
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
    validate(sheetPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const str = yield this.compile(sheetPath, CompilerMode.validate);
            const obj = JSON.parse(str);
            return new ValidationResult(obj);
        });
    }
    paramsToString(params) {
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