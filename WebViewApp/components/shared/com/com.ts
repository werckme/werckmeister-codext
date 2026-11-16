/** the api to communicate with the extension host, provided by vscode inside a webview */
export interface VsCodeApi {
    postMessage(message: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

let vscodeApi: VsCodeApi | null = null;

/** acquireVsCodeApi() may only be called once per webview */
export function getVsCodeApi(): VsCodeApi {
    if (!vscodeApi) {
        vscodeApi = acquireVsCodeApi();
    }
    return vscodeApi;
}
