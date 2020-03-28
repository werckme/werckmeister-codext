"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Diagnostic_1 = require("./features/Diagnostic");
let singleton = null;
class Language {
    constructor() {
        this.features = {
            diagnostic: new Diagnostic_1.Diagnostic()
        };
    }
}
exports.Language = Language;
function getLanguage() {
    if (!singleton) {
        singleton = new Language();
    }
    return singleton;
}
exports.getLanguage = getLanguage;
//# sourceMappingURL=Language.js.map