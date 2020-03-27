import { exec, ChildProcess, ExecException } from 'child_process';
import { IsWindows, toWMBINPath } from './Player';

export const CompilerExecutable = IsWindows ? 'sheetc.exe' : 'sheetc';

export enum CompilerMode {
    normal = "normal",
    json = "json",
    validate = "validate"
}

export class Params {
    constructor(public sheetPath: string, public mode:CompilerMode = CompilerMode.normal) {
    }
};

export interface IValidationSource {
    sourceId: number;
    path: string;
}

export interface IWarning {
    message: string;
}

export interface IValidationResult {
    sources: IValidationSource[] | undefined;
    duration: number | undefined;
    warings: IWarning[] | undefined;
}

export interface IValidationErrorResult {
    sourceId: number | undefined;
    positionBegin: number | undefined;
    sourceFile: string | undefined;
    errorMessage: string | undefined;
}

export class ValidationResult {
    constructor(public source: IValidationResult|IValidationErrorResult) {}
    get isError(): boolean {
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
    
    private _execute(cmd:string, callback: (err:any, stdout: any, stderr: any)=>void): ChildProcess {
        return exec(cmd, callback);
    }

    async compile(sheetPath: string, mode: CompilerMode = CompilerMode.normal): Promise<string> {
        const params = new Params(sheetPath, mode);
        return new Promise((resolve, reject)=>{
            let cmd = `${this.wmCompilerPath} ${this.paramsToString(params)}`;
            this.process = this._execute(cmd, (err:any, stdout: any, stderr: any) => {
                if (!!err) {
                    this.process = null;
                    if (mode !== CompilerMode.validate) {
                        reject(stderr);
                        return;
                    }
                    resolve(stdout.toString());
                    return;
                }
                resolve(stdout.toString());
                this.process = null;
            });
        });
    }

    async validate(sheetPath: string): Promise<ValidationResult> {
        const str: string = await this.compile(sheetPath, CompilerMode.validate);
        console.log(str);
        const obj = JSON.parse(str);
        return new ValidationResult(obj);
    }


    private paramsToString(params: Params) {
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
