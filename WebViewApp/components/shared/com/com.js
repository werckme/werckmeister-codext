let __vscodeApi = null;

export function getVsCodeApi() {
    if (!__vscodeApi) {
        __vscodeApi = acquireVsCodeApi();
    }
    return __vscodeApi;
}