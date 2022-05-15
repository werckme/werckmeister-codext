/**
 * executes the werckmeister compiler: sheetc
 */
import { spawn, ChildProcess, ExecException } from 'child_process';
import { IsWindows, toWMBINPath } from './Player';
import { WMMinimumWerckmeisterCompilerVersion } from '../extension';
import { existsSync as exists } from 'fs';

export const CompilerExecutable = IsWindows ? 'sheetc.exe' : 'sheetc';

const debugSymbolSupportVersion = 10330;

export enum CompilerMode {
    normal = "normal",
    json = "json",
    validate = "validate",
    debugSymbols = "debugSymbols"
}

let _lastVersionCheckSucceed: boolean = false;
let _debugSymbolSupport: boolean|null = null;

export class Params {
    getVersion: boolean = false;
    output: string|null = null;
    constructor(public sheetPath: string = "", public mode:CompilerMode = CompilerMode.normal) {
    }
};

export interface IValidationSource {
    sourceId: number;
    path: string;
}

export interface IWarning {
    message: string;
    sourceId: number;
    positionBegin: number;
    sourceFile: string;
}

export interface IValidationResult {
    sources: IValidationSource[];
    duration: number;
    warnings: IWarning[];
}

export interface IValidationErrorResult {
    sourceId: number;
    positionBegin: number;
    sourceFile: string;
    errorMessage: string;
}

export class VersionMismatchException extends Error {
    constructor(public currentVersion: string, public minimumVersion: string = WMMinimumWerckmeisterCompilerVersion) {
        super(`minimum required Werckmeister version is ${minimumVersion}`);
    }
}

export function werckmeisterVersionToNumber(version: string) {
    version = version.replace(/\./g, "");
    let number = 0;
    let base = 10000;
    for(const char of version) {
        number += Number.parseInt(char) * base;
        base /= 10;
    }
    return number;
}

export class ValidationResult {
    constructor(public source: IValidationResult|IValidationErrorResult) {}
    get hasErrors(): boolean {
        return !!this.errorResult.errorMessage;
    }
    get validationResult(): IValidationResult {
        return this.source as IValidationResult;
    }

    get errorResult(): IValidationErrorResult {
        return this.source as IValidationErrorResult;
    }
}

export class Compiler {
    private _pid: number = 0;
    private process: ChildProcess|null = null;

    get wmCompilerPath(): string {
        return toWMBINPath(CompilerExecutable);
    }
    
    async getVersion(): Promise<string> {
       const params = new Params();
       params.getVersion = true;
       let version = await this.executeCompiler(params);
       version = version.split("@")[0];
       return version;
    }

    async isDebugSymbolsSupported(): Promise<boolean> {
        if (_debugSymbolSupport === null) {
            await this.checkVersion();
        }
        if (_debugSymbolSupport === null) {
            return false;
        }
        return _debugSymbolSupport;
    }

    async checkVersion() {
        if (_lastVersionCheckSucceed) {
            return;
        }
        const strVersion:string = await this.getVersion();
        const version:number = werckmeisterVersionToNumber(strVersion);
        const minVersion:number = werckmeisterVersionToNumber(WMMinimumWerckmeisterCompilerVersion);
        _debugSymbolSupport = version >= debugSymbolSupportVersion;
        if (version >= minVersion) {
            _lastVersionCheckSucceed = true;
            return;
        }
        throw new VersionMismatchException(strVersion);
    }

    private _execute(cmd:string, args: string[], callback: (err:any, stdout: any, stderr: any)=>void): ChildProcess {
        const newProcess = spawn(cmd, args);
        let stdout = "";
        let stderr = "";
        newProcess.stdout.on('data', (data) => {
            stdout += data;
        });

        newProcess.stderr.on('data', (data) => {
            stderr += data
        });

        newProcess.on('close', (code) => {
            const hasError = code !== 0;
            callback(hasError ? {} : null, stdout, stderr);
        });

        return newProcess;
    }

    protected async executeCompiler(params: Params): Promise<string>  {
        return new Promise((resolve, reject)=>{
            this.process = this._execute(this.wmCompilerPath, this.configToArgs(params), (err:any, stdout: any, stderr: any) => {
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
    }

    async compile(sheetPath: string, mode: CompilerMode = CompilerMode.normal, output: string|null = null): Promise<string> {
        await this.checkVersion();
        const params = new Params(sheetPath, mode);
        params.output = output;
        return this.executeCompiler(params);
    }

    async validate(sheetPath: string): Promise<ValidationResult> {
        const str = await this.compile(sheetPath, CompilerMode.validate);
        const obj = JSON.parse(str);
        return new ValidationResult(obj);
    }


    private configToArgs(params: Params): string[] {
        if (params.getVersion) {
            return ["--version"];
        }
        if (!params.sheetPath) {
            throw new Error('missing sheet path');
        }
        let options = [
            params.sheetPath,
        ];
        if(params.mode) {
            options.push(`--mode=${params.mode.toString()}`);
        }
        if (params.output) {
            options.push(`--output=${params.output}`);
        }
        return options;
    }
    
}
