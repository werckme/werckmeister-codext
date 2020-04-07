/**
 * executes the werckmeister compiler: sheetc
 */
import { exec, ChildProcess, ExecException } from 'child_process';
import { IsWindows, toWMBINPath } from './Player';
import { WMMinimumWerckmeisterCompilerVersion } from '../extension';
import { type } from 'os';

export const CompilerExecutable = IsWindows ? 'sheetc.exe' : 'sheetc';

export enum CompilerMode {
    normal = "normal",
    json = "json",
    validate = "validate",
    analyze = "analyze"
}

let _lastVersionCheckSucceed: boolean = false;

export class Params {
    getVersion: boolean = false;
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

export type TextPosition = number;
export type Quarters = number;
export type SourceId = number;

export interface IAnylzerEvent {
    sourceId: SourceId;
    positionBegin: TextPosition;
    quarterPosition: Quarters;
    duration: Quarters;
}

export interface IBarEvent extends IAnylzerEvent {
    barCount: number;
    barLength: Quarters;
}

export interface IValidationResult {
    sources: IValidationSource[];
    duration: number;
    warnings: IWarning[];
    barEvents: IBarEvent[];
    analyzerEvents: IAnylzerEvent[];
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
    return Number.parseInt(version);
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

export class AnalyzeResult extends ValidationResult {
    constructor(public source: IValidationResult|IValidationErrorResult) {
        super(source);
    }
    get barEvents(): IBarEvent[] {
        return this.validationResult.barEvents;
    }

    get analyzerEvents(): IAnylzerEvent[] {
        return this.validationResult.analyzerEvents;
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

    async checkVersion() {
        if (_lastVersionCheckSucceed) {
            return;
        }
        const strVersion:string = await this.getVersion();
        const version:number = werckmeisterVersionToNumber(strVersion);
        const minVersion:number = werckmeisterVersionToNumber(WMMinimumWerckmeisterCompilerVersion);
        
        if (version >= minVersion) {
            _lastVersionCheckSucceed = true;
            return;
        }
        throw new VersionMismatchException(strVersion);
    }

    private _execute(cmd:string, callback: (err:any, stdout: any, stderr: any)=>void): ChildProcess {
        return exec(cmd, callback);
    }

    protected async executeCompiler(params: Params): Promise<string>  {
        return new Promise((resolve, reject)=>{
            let cmd = `${this.wmCompilerPath} ${this.paramsToString(params)}`;
            this.process = this._execute(cmd, (err:any, stdout: any, stderr: any) => {
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

    async compile(sheetPath: string, mode: CompilerMode = CompilerMode.normal): Promise<string> {
        await this.checkVersion();
        const params = new Params(sheetPath, mode);
        return this.executeCompiler(params);
    }

    async validate(sheetPath: string): Promise<ValidationResult> {
        const str = await this.compile(sheetPath, CompilerMode.validate);
        const obj = JSON.parse(str);
        return new ValidationResult(obj);
    }

    async analyze(sheetPath: string): Promise<AnalyzeResult> {
        const str = await this.compile(sheetPath, CompilerMode.analyze);
        const obj = JSON.parse(str);
        return new AnalyzeResult(obj);
    }


    private paramsToString(params: Params) {
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
