import { LanguageFeatures } from "@werckmeister/language-features";
import { AutoComplete } from "./features/AutoComplete";
import { Diagnostic as DiagnosticFeature } from "./features/Diagnostic";
import { HoverInfo } from "./features/HoverInfo";
import { EnvironmentInspector } from "./features/impl/EnvironmentInspector";
import { FileSystemInspector } from "./features/impl/FileSystemInspector";


let singleton: Language|null = null;

export class Language {
    private werckmeisterFeatures: LanguageFeatures;
    public features: {
        diagnostic: DiagnosticFeature,
        autoComplete: AutoComplete,
        hoverInfo: HoverInfo
    };
    constructor() {
        this.werckmeisterFeatures = new LanguageFeatures(new FileSystemInspector(), new EnvironmentInspector());
        this.features = {
            autoComplete: new AutoComplete(this.werckmeisterFeatures),
            hoverInfo: new HoverInfo(this.werckmeisterFeatures),
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


