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
const vscode = require("vscode");
const Play_1 = require("./Play");
const Player_1 = require("../com/Player");
let _lastPosition = 0;
class PlayFromPosition extends Play_1.Play {
    execute() {
        const _super = Object.create(null, {
            execute: { get: () => super.execute }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const input = yield vscode.window.showInputBox({ value: _lastPosition.toString(), prompt: "start position in quarters" });
            if (input === undefined) {
                return;
            }
            const quarters = Number.parseFloat(input);
            if (Number.isNaN(quarters)) {
                return;
            }
            _lastPosition = quarters;
            const player = Player_1.getPlayer();
            yield player.stop();
            player.begin = quarters;
            return _super.execute.call(this);
        });
    }
}
exports.PlayFromPosition = PlayFromPosition;
//# sourceMappingURL=PlayFromPosition.js.map