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
const events_1 = require("events");
exports.OnDispose = "OnDispose";
class AWebView {
    constructor(context) {
        this.context = context;
        this.onLifecycleEvent = new events_1.EventEmitter();
    }
    toWebViewUri(uri) {
        if (!this.panel) {
            throw new Error("panel == null");
        }
        const result = this.panel.webview.asWebviewUri(uri).toString();
        return result;
    }
    getExtensionPath(...pathComponents) {
        return path.join(this.context.extensionPath, ...pathComponents);
    }
    registerListener() {
    }
    removeListener() {
    }
    onPanelDidDispose() { }
    createPanel() {
        return __awaiter(this, void 0, void 0, function* () {
            const panel = yield this.createPanelImpl();
            this.registerListener();
            panel.onDidDispose(() => {
                this.removeListener();
                this.onLifecycleEvent.emit(exports.OnDispose);
                this.onPanelDidDispose();
            });
        });
    }
}
exports.AWebView = AWebView;
//# sourceMappingURL=AWebView.js.map