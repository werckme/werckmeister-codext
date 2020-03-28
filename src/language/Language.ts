import { Diagnostic as DiagnosticFeature } from "./features/Diagnostic";


let singleton: Language|null = null;

export class Language {
    public features = {
        diagnostic: new DiagnosticFeature()
    }
}

export function getLanguage(): Language {
    if (!singleton) {
        singleton = new Language();
    }
    return singleton;
}


