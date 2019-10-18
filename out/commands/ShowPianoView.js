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
const ACommand_1 = require("./ACommand");
const AWebView_1 = require("../com/AWebView");
const PianoView_1 = require("../com/PianoView");
let currentView = null;
class ShowPianoView extends ACommand_1.ACommand {
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            if (currentView !== null) {
                return;
            }
            currentView = new PianoView_1.PianoView(this.context);
            yield currentView.createPanel();
            currentView.onLifecycleEvent.on(AWebView_1.OnDispose, () => {
                currentView = null;
            });
        });
    }
}
exports.ShowPianoView = ShowPianoView;
//# sourceMappingURL=ShowPianoView.js.map