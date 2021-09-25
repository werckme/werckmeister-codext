"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const language_features_1 = require("@werckmeister/language-features");
const AutoComplete_1 = require("./features/AutoComplete");
const Diagnostic_1 = require("./features/Diagnostic");
const FileSystemInspector_1 = require("./features/impl/FileSystemInspector");
let singleton = null;
class Language {
    constructor() {
        this.werckmeisterFeatures = new language_features_1.LanguageFeatures(new FileSystemInspector_1.FileSystemInspector());
        this.features = {
            autoComplete: new AutoComplete_1.AutoComplete(this.werckmeisterFeatures),
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