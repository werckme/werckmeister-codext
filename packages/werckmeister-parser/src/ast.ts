/**
 * AST / CST types of the werckmeister parser.
 *
 * All spans are absolute character offsets [start, end) into the parsed text
 * (plus `ParseOptions.offset`, if given).
 *
 * The grammar mirrors the boost spirit parser of the werckmeister compiler:
 *   werckmeister/src/parser/sheetParser.cpp
 *   werckmeister/src/parser/valueParser.cpp
 *   werckmeister/src/parser/parserSymbols.h
 */

export interface Span {
    start: number;
    end: number;
}

// ---------------------------------------------------------------------------
// Tokens (lossless: the concatenation of all token texts equals the input)
// ---------------------------------------------------------------------------

export type TokenKind =
    | "whitespace"
    | "comment"          // `-- ...` and `/* ... */`
    | "keyword"          // `using`
    | "string"           // `"..."` (using path, quoted argument value)
    | "identifier"       // config name, meta command name, phrase definition name
    | "argumentName"     // `_name` incl. the underscore
    | "argumentValue"
    | "tag"              // a single tag inside `"tag1 tag2"@`
    | "pitch"            // c, c#, eb, ...
    | "degree"           // I, II#, VIIb, ...
    | "alias"            // `"bassdrum"` used as pitch
    | "extendedPitch"    // h..z (except r, t)
    | "forceDegree"      // `!` in front of a degree
    | "octave"           // ' '' ,, ...
    | "duration"         // 4 8. 16t 4n5 ...
    | "tie"              // ~
    | "vorschlag"        // ->
    | "chord"            // Cmaj7, D-7/C ...
    | "rest"             // r
    | "repeat"           // &
    | "repeatBar"        // %
    | "number"
    | "expression"       // p, ff, ... (after `\` or `!`)
    | "barLine"          // |
    | "repeatSign"       // `:` of a repeat begin/end
    | "volta"            // ^1
    | "phraseName"
    | "punctuation"      // [ ] { } ( ) < > / : ; = @ " \ ! > >> =
    | "error";

export interface Token extends Span {
    kind: TokenKind;
}

export interface ParseError extends Span {
    message: string;
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

export interface Tag extends Span {
    name: string;
}

export interface Duration extends Span {
    /** the duration literal, e.g. "4", "8.", "16t", "4n5" */
    value: string;
}

export type PitchKind = "pitch" | "degree" | "alias" | "extendedPitch";

export interface Pitch extends Span {
    kind: PitchKind;
    /**
     * e.g. "c#", "IV", "bassdrum" (alias without quotes), "x'".
     * For extended pitches the octave marks are part of the name (they are aliases in the compiler).
     */
    name: string;
    nameSpan: Span;
    /** -5..5, number of `'` minus number of `,` */
    octave: number;
    /**
     * Span of the octave marks. Zero length (start == end == nameSpan.end)
     * if the pitch has no octave marks. Aliases and extended pitches never have octave marks.
     */
    octaveSpan: Span;
    /** `!I`: degree forced to be rendered as degree */
    forceDegree: boolean;
}

interface EventBase extends Span {
    tags: Tag[];
}

/** note and degree events: `c`, `"t"@c'4~`, `<c e g>8.`, `I->`, `!II,` */
export interface NoteEvent extends EventBase {
    kind: "note" | "degree";
    pitches: Pitch[];
    /** written as `<...>` */
    isChord: boolean;
    duration?: Duration;
    tied: boolean;
    vorschlag: boolean;
}

/** `&` */
export interface RepeatEvent extends EventBase {
    kind: "repeat";
    duration?: Duration;
    tied: boolean;
    vorschlag: boolean;
}

/** `%` */
export interface RepeatBarEvent extends EventBase {
    kind: "repeatBar";
    duration?: Duration;
}

/** `Cmaj7`, `D-7/C` */
export interface ChordEvent extends EventBase {
    kind: "chord";
    name: string;
}

/** `\p` (once = false), `!ff` (once = true) */
export interface ExpressionEvent extends EventBase {
    kind: "expression";
    value: string;
    once: boolean;
}

/** `r`, `r4` */
export interface RestEvent extends EventBase {
    kind: "rest";
    duration?: Duration;
}

/** `=4=` */
export interface MultiMeasureRestEvent extends EventBase {
    kind: "multiMeasureRest";
    bars: number;
}

/** `|`, `|^1`, `|:`, `:|`, `:(x2)|`, `:|:` */
export interface BarLineEvent extends EventBase {
    kind: "barLine";
    repeatBegin: boolean;
    repeatEnd: boolean;
    /** `:(x3)|` -> 3 */
    repeatCount?: number;
    /** `|^1` -> "1" */
    volta?: string;
}

export interface Argument extends Span {
    /** `_name=value` -> "name"; positional arguments have no name */
    name?: string;
    /** unquoted value */
    value: string;
    valueSpan: Span;
}

/** `/cc: 7 100/` */
export interface MetaEvent extends EventBase {
    kind: "meta";
    name: string;
    args: Argument[];
}

/** `>"myPhrase"4` (stretched = true), `>>"myPhrase"` (stretched = false) */
export interface PhraseEvent extends EventBase {
    kind: "phrase";
    name: string;
    stretched: boolean;
    duration?: Duration;
    tied: boolean;
}

/** `"tag"@(c d e)4` */
export interface GroupEvent extends EventBase {
    kind: "group";
    events: EventNode[];
    duration?: Duration;
    /** false if the closing `)` is missing (only possible in fragments / on errors) */
    closed: boolean;
}

/** text that could not be parsed */
export interface ErrorNode extends Span {
    kind: "error";
    tags: Tag[];
    message: string;
}

export type EventNode =
    | NoteEvent
    | RepeatEvent
    | RepeatBarEvent
    | ChordEvent
    | ExpressionEvent
    | RestEvent
    | MultiMeasureRestEvent
    | BarLineEvent
    | MetaEvent
    | PhraseEvent
    | GroupEvent
    | ErrorNode;

export type EventKind = EventNode["kind"];

/** `using "./chords/default.chords";` */
export interface UsingNode extends Span {
    kind: "using";
    path: string;
}

/** document config `tempo: 120;` or track config `instrument: piano;` */
export interface ConfigNode extends Span {
    kind: "config";
    name: string;
    nameSpan: Span;
    args: Argument[];
}

/** `myPhrase = c d e;` */
export interface PhraseDefNode extends Span {
    kind: "phraseDef";
    name: string;
    nameSpan: Span;
    events: EventNode[];
    closed: boolean;
}

export interface VoiceNode extends Span {
    kind: "voice";
    events: EventNode[];
    closed: boolean;
}

export interface TrackNode extends Span {
    kind: "track";
    configs: ConfigNode[];
    voices: VoiceNode[];
    closed: boolean;
}

/** a structural character without its counterpart, e.g. the `}` in a fragment `c d } { e` */
export interface DelimiterNode extends Span {
    kind: "delimiter";
    value: "[" | "]" | "{" | "}" | ";";
}

export type TopLevelItem = UsingNode | ConfigNode | PhraseDefNode | TrackNode | ErrorNode;

export interface DocumentNode extends Span {
    kind: "document";
    items: TopLevelItem[];
}

export type FragmentItem = TopLevelItem | VoiceNode | DelimiterNode | EventNode;

export interface FragmentNode extends Span {
    kind: "fragment";
    items: FragmentItem[];
}

export type AnyNode =
    | DocumentNode
    | FragmentNode
    | TopLevelItem
    | VoiceNode
    | DelimiterNode
    | EventNode;

export interface ParseOptions {
    /** added to every span, e.g. the document offset of a selection */
    offset?: number;
}

export interface ParseResult<T> {
    root: T;
    tokens: Token[];
    errors: ParseError[];
}
