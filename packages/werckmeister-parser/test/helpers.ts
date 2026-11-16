import * as fs from "fs";
import * as path from "path";
import { EventNode, FragmentItem, Pitch, Span, Tag, Argument, Duration } from "../src/ast";
import { parseFragment } from "../src";

/**
 * Canonical short notation of an event. Whitespace and comments are dropped,
 * everything else is printed in a normalized werckmeister syntax, prefixed with the kind:
 *
 *   note:"t1 t2"@<c e,>4~   degree:!I'->   chord:Cmaj7   barLine::(x2)|^1:
 */
export function brief(event: FragmentItem): string {
    switch (event.kind) {
        case "note":
        case "degree": {
            const pitches = event.pitches.map(briefPitch).join(" ");
            const body = event.isChord ? `<${pitches}>` : pitches;
            return `${event.kind}:${tags(event.tags)}${body}${dur(event.duration)}`
                + `${event.tied ? "~" : ""}${event.vorschlag ? "->" : ""}`;
        }
        case "repeat":
            return `repeat:${tags(event.tags)}&${dur(event.duration)}${event.tied ? "~" : ""}${event.vorschlag ? "->" : ""}`;
        case "repeatBar":
            return `repeatBar:${tags(event.tags)}%${dur(event.duration)}`;
        case "chord":
            return `chord:${tags(event.tags)}${event.name}`;
        case "expression":
            return `expression:${event.once ? "!" : "\\"}${event.value}`;
        case "rest":
            return `rest:r${dur(event.duration)}`;
        case "multiMeasureRest":
            return `multiMeasureRest:=${event.bars}=`;
        case "barLine":
            return `barLine:${event.repeatEnd ? ":" : ""}`
                + `${event.repeatCount !== undefined ? `(x${event.repeatCount})` : ""}|`
                + `${event.volta !== undefined ? `^${event.volta}` : ""}${event.repeatBegin ? ":" : ""}`;
        case "meta":
            return `meta:/${event.name}: ${args(event.args)}/`;
        case "phrase":
            return `phrase:${tags(event.tags)}${event.stretched ? ">" : ">>"}"${event.name}"${dur(event.duration)}${event.tied ? "~" : ""}`;
        case "group":
            return `group:${tags(event.tags)}(${event.events.map(brief).join(" ")}${event.closed ? ")" : ""}${dur(event.duration)}`;
        case "error":
            return `error`;
        case "using":
            return `using:"${event.path}"`;
        case "config":
            return `config:${event.name}: ${args(event.args)};`;
        case "phraseDef":
            return `phraseDef:${event.name} = ${event.events.map(brief).join(" ")}${event.closed ? ";" : ""}`;
        case "voice":
            return `voice:{${event.events.map(brief).join(" ")}${event.closed ? "}" : ""}`;
        case "track":
            return `track:[${[...event.configs, ...event.voices].map(brief).join(" ")}${event.closed ? "]" : ""}`;
        case "delimiter":
            return `delimiter:${event.value}`;
    }
}

function briefPitch(p: Pitch): string {
    const name = p.kind === "alias" ? `"${p.name}"` : p.name;
    const octave = p.octave > 0 ? "'".repeat(p.octave) : ",".repeat(-p.octave);
    return `${p.forceDegree ? "!" : ""}${name}${octave}`;
}

function tags(t: Tag[]): string {
    return t.length ? `"${t.map(x => x.name).join(" ")}"@` : "";
}

function dur(d?: Duration): string {
    return d ? d.value : "";
}

function args(a: Argument[]): string {
    return a.map(x => `${x.name !== undefined ? `_${x.name}=` : ""}${x.value}`).join(" ");
}

/** parses `src` as fragment and returns the brief notation of its top level items */
export function briefFragment(src: string): string[] {
    return parseFragment(src).root.items.map(brief);
}

export function textOf(src: string, span: Span, offset = 0): string {
    return src.substring(span.start - offset, span.end - offset);
}

// ---------------------------------------------------------------------------
// corpus
// ---------------------------------------------------------------------------

/**
 * Directories with real world werckmeister files.
 * Override with WERCKMEISTER_CORPUS (path list, separated by path.delimiter).
 */
export function corpusDirs(): string[] {
    const env = process.env.WERCKMEISTER_CORPUS;
    const dirs = env
        ? env.split(path.delimiter)
        : [
            path.resolve(__dirname, "../../../../../werckmeister/rendertests/tests"),
            path.resolve(__dirname, "../../../../../werckmeister/examples"),
        ];
    return dirs.filter(d => fs.existsSync(d));
}

/** all sheet grammar files (.sheet .template .part .config) of the corpus */
export function corpusFiles(): string[] {
    const exts = new Set([".sheet", ".template", ".part", ".config"]);
    const result: string[] = [];
    for (const dir of corpusDirs()) {
        for (const file of fs.readdirSync(dir)) {
            if (exts.has(path.extname(file))) {
                result.push(path.join(dir, file));
            }
        }
    }
    return result.sort();
}

/** deterministic PRNG (mulberry32), so random tests are reproducible */
export function prng(seed: number): () => number {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
