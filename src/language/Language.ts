import { LanguageFeatures } from "@werckmeister/language-features";
import { AutoComplete } from "./features/AutoComplete";
import { Diagnostic as DiagnosticFeature } from "./features/Diagnostic";
import { FileSystemInspector } from "./features/impl/FileSystemInspector";


let singleton: Language|null = null;

export class Language {
    private werckmeisterFeatures: LanguageFeatures;
    public features: {
        diagnostic: DiagnosticFeature,
        autoComplete: AutoComplete
    };
    constructor() {
        this.werckmeisterFeatures = new LanguageFeatures(new FileSystemInspector());
        this.features = {
            autoComplete: new AutoComplete(this.werckmeisterFeatures),
            diagnostic: new DiagnosticFeature()
        };
    }

}

export function getLanguage(): Language {
    if (!singleton) {
        singleton = new Language();
    }
    return singleton;
}


