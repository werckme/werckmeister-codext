import {
    Argument, BarLineEvent, ChordEvent, ConfigNode, ExpressionEvent, MetaEvent, MultiMeasureRestEvent, PhraseEvent, RepeatBarEvent, RepeatEvent, RestEvent, DelimiterNode, DocumentNode, Duration, ErrorNode, EventNode, FragmentItem,
    FragmentNode, GroupEvent, NoteEvent, ParseError, ParseOptions, ParseResult, PhraseDefNode, Pitch,
    Span, Tag, Token, TokenKind, TopLevelItem, TrackNode, UsingNode, VoiceNode,
} from "./ast";

/**
 * Parses a complete sheet (also .template, .part and .config files).
 * Never throws: syntax errors are reported in `errors` and as `error` nodes.
 */
export function parseDocument(text: string, options: ParseOptions = {}): ParseResult<DocumentNode> {
    const parser = new Parser(text, options.offset || 0, false);
    const root = parser.document();
    return { root, tokens: parser.finishTokens(), errors: parser.errors };
}

/**
 * Parses an arbitrary piece of werckmeister code, e.g. an editor selection.
 * Assumes the fragment starts in an "events" context but also accepts
 * document level constructs and unbalanced brackets (`c d } { e f`).
 * Unclosed constructs at the end of the fragment are not reported as errors.
 * Never throws.
 */
export function parseFragment(text: string, options: ParseOptions = {}): ParseResult<FragmentNode> {
    const parse = (context: StartContext): ParseResult<FragmentNode> | undefined => {
        const parser = new Parser(text, options.offset || 0, true);
        const root = parser.fragment(context);
        return root ? { root, tokens: parser.finishTokens(), errors: parser.errors } : undefined;
    };
    let best = parse("events")!;
    // the fragment may start in the middle of something: take the reading with the fewest errors
    for (const context of ALTERNATIVE_START_CONTEXTS) {
        if (best.errors.length === 0) {
            break;
        }
        const alternative = parse(context);
        if (alternative && alternative.errors.length < best.errors.length) {
            best = alternative;
        }
    }
    return best;
}

/**
 * Where a fragment starts:
 *   events:       normal
 *   metaTail:     inside a meta event `/cc: 7 1«00/ c d»`
 *   quoteTail:    inside a tag, alias or quoted value `"my«Tag"@c d»`
 *   commentTail:  inside a block comment `/* x «y *\/ c d»`
 */
type StartContext = "events" | "metaTail" | "quoteTail" | "commentTail";
const ALTERNATIVE_START_CONTEXTS: StartContext[] = ["metaTail", "quoteTail", "commentTail"];

// ---------------------------------------------------------------------------
// lexical definitions (see werckmeister/src/parser/parserSymbols.h)
// ---------------------------------------------------------------------------

const PITCH = /[a-g][#b]?/y;
const DEGREE = /(?:VII|VI|V|IV|III|II|I)(?:#{1,3}|b{1,3})?/y;
const OCTAVE = /'{1,5}|,{1,5}/y;
const EXTENDED_PITCH = /[hijklmnopqsuvwxyz]'{0,5},{0,5}/y;
const DURATION = /(?:128|16|32|64|1|2|4|8)(?:\.{1,4}|t|n[579])?/y;
const EXPRESSION = /p{1,5}|f{1,5}/y;
const CHORD = /[a-gA-G][a-zA-Z0-9\/+#~*!?-]*/y;
const TAG = /[a-zA-Z0-9,`':;?.!()\[\]<>+*\/=$%&@\\^_|~-]+/y;
const ALIAS = /"[^"]+"/y;
const QUOTED = /"[^"]+"/y;
const PHRASE_NAME = /"[a-zA-Z0-9_]+"/y;
const ARGUMENT_VALUE = /[a-zA-Z0-9.]+/y;
const INT = /[+-]?[0-9]+/y;
const VOLTA = /\^[0-9]+/y;
const ALPHA = /[a-zA-Z]+/y;
const ALNUM = /[a-zA-Z0-9]+/y;
const PHRASE_DEF_NAME = /[a-zA-Z0-9_]+/y;
const USING = /using/y;

/** characters which end an error chunk (and form an error chunk on their own) */
const STOP_CHARS = new Set("{}[]()<>;|/\"@:=&%\\!~");

function isSpace(c: string): boolean {
    return c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\v" || c === "\f";
}

/**
 * Same algorithm as com::removeComments of the werckmeister compiler:
 * returns a mask with all comment characters.
 */
function commentMask(s: string): Uint8Array {
    const mask = new Uint8Array(s.length);
    let clearing = false;
    let multiline = false;
    let closeAt = -1;
    for (let i = 0; i < s.length; i++) {
        const c = i === closeAt ? " " : s[i];
        if (!multiline && c === "\n") {
            clearing = false;
        }
        if (!clearing && c === "/" && s[i + 1] === "*") {
            clearing = true;
            multiline = true;
        }
        if (multiline && c === "*" && s[i + 1] === "/") {
            clearing = false;
            multiline = false;
            mask[i] = 1;
            mask[i + 1] = 1;
            closeAt = i + 1;
        }
        if (!multiline && c === "-" && s[i + 1] === "-") {
            clearing = true;
        }
        if (clearing) {
            mask[i] = 1;
        }
    }
    return mask;
}

interface State {
    p: number;
    last: number;
    tokens: number;
    errors: number;
}

interface Match {
    text: string;
    start: number;
    end: number;
}

type EventList = { events: EventNode[]; closed: boolean };

class Parser {
    /** the text with all comments replaced by spaces */
    private s: string;
    private readonly mask: Uint8Array;
    private commentTailEnd: number;
    private p = 0;
    /** end of the last consumed significant character */
    private last = 0;
    private tokens: Token[] = [];
    readonly errors: ParseError[] = [];

    constructor(private readonly src: string, private readonly offset: number, private readonly isFragment: boolean) {
        this.mask = commentMask(src);
        this.commentTailEnd = src.indexOf("*/");
        if (this.commentTailEnd >= 0 && !this.mask[this.commentTailEnd]) {
            // the fragment possibly starts inside a block comment
            this.commentTailEnd += 2;
        } else {
            this.commentTailEnd = -1;
        }
        this.s = this.blank();
    }

    private blank(): string {
        let blank = "";
        for (let i = 0; i < this.src.length; i++) {
            blank += this.mask[i] ? " " : this.src[i];
        }
        return blank;
    }

    // -----------------------------------------------------------------------
    // infrastructure
    // -----------------------------------------------------------------------

    private mark(): State {
        return { p: this.p, last: this.last, tokens: this.tokens.length, errors: this.errors.length };
    }

    private reset(state: State) {
        this.p = state.p;
        this.last = state.last;
        this.tokens.length = state.tokens;
        this.errors.length = state.errors;
    }

    /** runs `fn`, restores the parser state if it returns undefined */
    private attempt<T>(fn: () => T | undefined): T | undefined {
        const state = this.mark();
        const result = fn();
        if (result === undefined) {
            this.reset(state);
        }
        return result;
    }

    private span(start: number, end: number): Span {
        return { start: start + this.offset, end: end + this.offset };
    }

    private token(kind: TokenKind, start: number, end: number) {
        if (end > start) {
            this.tokens.push({ kind, ...this.span(start, end) });
            this.last = end;
        }
    }

    private error(message: string, start: number, end: number) {
        this.errors.push({ message, ...this.span(start, end) });
    }

    private skip() {
        while (this.p < this.s.length && isSpace(this.s[this.p])) {
            this.p++;
        }
    }

    private atEnd(): boolean {
        this.skip();
        return this.p >= this.s.length;
    }

    /** end of input inside a fragment: unclosed constructs are accepted */
    private fragmentEnd(): boolean {
        return this.isFragment && this.atEnd();
    }

    private peek(): string {
        this.skip();
        return this.s[this.p];
    }

    private lit(text: string, kind: TokenKind = "punctuation"): boolean {
        this.skip();
        if (!this.s.startsWith(text, this.p)) {
            return false;
        }
        this.token(kind, this.p, this.p + text.length);
        this.p += text.length;
        return true;
    }

    private re(regex: RegExp, kind: TokenKind): Match | undefined {
        this.skip();
        regex.lastIndex = this.p;
        const m = regex.exec(this.s);
        if (!m || m[0].length === 0) {
            return undefined;
        }
        const match = { text: m[0], start: this.p, end: this.p + m[0].length };
        this.token(kind, match.start, match.end);
        this.p = match.end;
        return match;
    }

    /**
     * `+char_(...)` inside a non lexeme spirit rule: the skipper runs between
     * every character, so "tem po" is read as "tempo".
     */
    private skippingRun(regex: RegExp, kind: TokenKind): Match | undefined {
        let result: Match | undefined;
        for (;;) {
            const m = this.re(regex, kind);
            if (!m) {
                return result;
            }
            result = result
                ? { text: result.text + m.text, start: result.start, end: m.end }
                : m;
        }
    }

    /** tokens for all significant characters in [start, end) */
    private errorTokens(start: number, end: number) {
        let i = start;
        while (i < end) {
            while (i < end && isSpace(this.s[i])) {
                i++;
            }
            const j = i;
            while (i < end && !isSpace(this.s[i])) {
                i++;
            }
            this.token("error", j, i);
        }
    }

    finishTokens(): Token[] {
        const result: Token[] = [];
        let pos = this.offset;
        const fill = (end: number) => {
            // whitespace, comments and (should not happen) unclaimed characters
            while (pos < end) {
                const i = pos - this.offset;
                const kind: TokenKind = this.mask[i] ? "comment" : isSpace(this.s[i]) ? "whitespace" : "error";
                let j = i + 1;
                while (j < end - this.offset) {
                    const k: TokenKind = this.mask[j] ? "comment" : isSpace(this.s[j]) ? "whitespace" : "error";
                    if (k !== kind) {
                        break;
                    }
                    j++;
                }
                result.push({ kind, start: pos, end: j + this.offset });
                pos = j + this.offset;
            }
        };
        for (const t of this.tokens) {
            fill(t.start);
            result.push(t);
            pos = t.end;
        }
        fill(this.offset + this.src.length);
        return result;
    }

    private node<T extends Span>(start: number, data: Omit<T, "start" | "end">): T {
        return { ...data, ...this.span(start, Math.max(start, this.last)) } as T;
    }

    // -----------------------------------------------------------------------
    // top level
    // -----------------------------------------------------------------------

    document(): DocumentNode {
        const items: TopLevelItem[] = [];
        while (!this.atEnd()) {
            const item = this.topLevelItem() || (this.peek() === "[" ? this.track() : undefined);
            if (item) {
                items.push(item);
                continue;
            }
            this.topLevelError(items);
        }
        return { kind: "document", items, ...this.span(0, this.src.length) };
    }

    /** returns undefined if the fragment can not start in the given context */
    fragment(context: StartContext = "events"): FragmentNode | undefined {
        const items: FragmentItem[] = [];
        if (!this.startContext(context, items)) {
            return undefined;
        }
        while (!this.atEnd()) {
            const c = this.s[this.p];
            if (c === "}" || c === "]" || c === ";") {
                const start = this.p;
                this.lit(c);
                items.push(this.node<DelimiterNode>(start, { kind: "delimiter", value: c as DelimiterNode["value"] }));
                continue;
            }
            if (c === "{") {
                items.push(this.voice());
                continue;
            }
            if (c === "[") {
                items.push(this.track());
                continue;
            }
            const item = this.topLevelItem() || this.eventItem();
            if (item) {
                items.push(item);
                continue;
            }
            this.errorChunk(items);
        }
        return { kind: "fragment", items, ...this.span(0, this.src.length) };
    }

    private startContext(context: StartContext, items: FragmentItem[]): boolean {
        switch (context) {
            case "events":
                return true;
            case "commentTail": {
                if (this.commentTailEnd < 0) {
                    return false;
                }
                // re-run the comment detection behind the comment end
                const rest = commentMask(this.src.substring(this.commentTailEnd));
                for (let i = 0; i < this.src.length; i++) {
                    this.mask[i] = i < this.commentTailEnd ? 1 : rest[i - this.commentTailEnd];
                }
                this.s = this.blank();
                return true;
            }
            case "quoteTail": {
                const end = this.s.indexOf("\"");
                if (end < 0) {
                    return false;
                }
                this.token("string", 0, end + 1);
                this.p = end + 1;
                this.lit("@");
                return true;
            }
            case "metaTail": {
                // [name ':'] args '/'
                const meta = this.attempt(() => {
                    this.skip();
                    const start = this.p;
                    const name = this.attempt(() => {
                        const n = this.skippingRun(ALPHA, "identifier");
                        return n && this.lit(":") ? n.text : undefined;
                    });
                    const args = this.arguments();
                    if (!this.lit("/")) {
                        return undefined;
                    }
                    return this.node<MetaEvent>(start, { kind: "meta", tags: [], name: name || "", args });
                });
                if (!meta) {
                    return false;
                }
                items.push(meta);
                return true;
            }
        }
    }

    private topLevelItem(): UsingNode | ConfigNode | PhraseDefNode | undefined {
        return this.attempt(() => this.using())
            || this.attempt(() => this.config())
            || this.attempt(() => this.phraseDef());
    }

    /** skips to the next `;` (inclusive) or `[` */
    private topLevelError(items: TopLevelItem[]) {
        const start = this.p;
        let i = this.p + 1;
        while (i < this.s.length && this.s[i - 1] !== ";" && this.s[i] !== "[") {
            i++;
        }
        this.errorTokens(start, i);
        this.p = i;
        this.pushError(items, start, "syntax error");
    }

    /** adds an error node, or extends the previous one if it directly precedes */
    private pushError(items: Array<{ kind: string } & Span>, start: number, message: string) {
        const prev = items[items.length - 1];
        const prevError = this.errors[this.errors.length - 1];
        if (prev && prev.kind === "error" && prevError && prevError.end === prev.end) {
            prev.end = this.last + this.offset;
            prevError.end = prev.end;
            return;
        }
        const node = this.node<ErrorNode>(start, { kind: "error", tags: [], message });
        items.push(node);
        this.error(message, start, this.last);
    }

    private using(): UsingNode | undefined {
        this.skip();
        const start = this.p;
        if (!this.re(USING, "keyword")) {
            return undefined;
        }
        const path = this.re(QUOTED, "string");
        if (!path || !this.lit(";")) {
            return undefined;
        }
        return this.node<UsingNode>(start, { kind: "using", path: path.text.slice(1, -1) });
    }

    private config(): ConfigNode | undefined {
        const name = this.skippingRun(ALPHA, "identifier");
        if (!name || !this.lit(":")) {
            return undefined;
        }
        const args = this.arguments();
        if (args.length === 0 || !this.lit(";")) {
            return undefined;
        }
        return this.node<ConfigNode>(name.start, {
            kind: "config", name: name.text, nameSpan: this.span(name.start, name.end), args,
        });
    }

    private phraseDef(): PhraseDefNode | undefined {
        const name = this.skippingRun(PHRASE_DEF_NAME, "identifier");
        if (!name || !this.lit("=")) {
            return undefined;
        }
        const events: EventNode[] = [];
        for (let ev = this.eventItem(); ev; ev = this.eventItem()) {
            events.push(ev);
        }
        let closed = true;
        if (!this.lit(";")) {
            if (!this.fragmentEnd()) {
                return undefined;
            }
            closed = false;
        }
        return this.node<PhraseDefNode>(name.start, {
            kind: "phraseDef", name: name.text, nameSpan: this.span(name.start, name.end), events, closed,
        });
    }

    private track(): TrackNode {
        this.skip();
        const start = this.p;
        this.lit("[");
        const configs: ConfigNode[] = [];
        const voices: VoiceNode[] = [];
        const errors: ErrorNode[] = [];
        let closed = false;
        while (!this.atEnd()) {
            const c = this.s[this.p];
            if (c === "]") {
                this.lit("]");
                closed = true;
                break;
            }
            if (c === "[") {
                break;
            }
            if (c === "{") {
                voices.push(this.voice());
                continue;
            }
            const config = voices.length === 0 ? this.attempt(() => this.config()) : undefined;
            if (config) {
                configs.push(config);
                continue;
            }
            this.errorChunk(errors);
        }
        const node = this.node<TrackNode>(start, { kind: "track", configs, voices, closed });
        if (closed && voices.length === 0) {
            this.error("a track needs at least one voice", start, this.last);
        }
        if (!closed) {
            this.unclosed("]", start);
        }
        return node;
    }

    private voice(): VoiceNode {
        this.skip();
        const start = this.p;
        this.lit("{");
        const { events, closed } = this.eventList("}", "[]{");
        if (!closed) {
            this.unclosed("}", start);
        }
        return this.node<VoiceNode>(start, { kind: "voice", events, closed });
    }

    private unclosed(expected: string, openedAt: number) {
        if (!this.fragmentEnd()) {
            this.error(`missing '${expected}'`, openedAt, openedAt + 1);
        }
    }

    // -----------------------------------------------------------------------
    // events
    // -----------------------------------------------------------------------

    /** events until `terminator`; stops (unclosed) at end of input or at one of `stops` */
    private eventList(terminator: string, stops: string): EventList {
        const events: EventNode[] = [];
        while (!this.atEnd()) {
            const c = this.s[this.p];
            if (c === terminator) {
                this.lit(c);
                return { events, closed: true };
            }
            if (stops.includes(c)) {
                break;
            }
            const ev = this.eventItem();
            if (ev) {
                events.push(ev);
                continue;
            }
            this.errorChunk(events);
        }
        return { events, closed: false };
    }

    /** consumes a piece of unparsable text */
    private errorChunk(items: Array<{ kind: string } & Span>) {
        this.skip();
        const start = this.p;
        if (this.s[this.p] === "\"" && this.s.indexOf("\"", this.p + 1) < 0) {
            // unterminated tag, alias or string
            if (this.isFragment) {
                // cut off at the end of the fragment: no error
                this.token("string", start, this.s.length);
                this.p = this.s.length;
                return;
            }
            this.p = this.s.length;
        } else if (STOP_CHARS.has(this.s[this.p])) {
            this.p++;
        } else {
            while (this.p < this.s.length && !isSpace(this.s[this.p]) && !STOP_CHARS.has(this.s[this.p])) {
                this.p++;
            }
        }
        this.errorTokens(start, this.p);
        this.pushError(items, start, "syntax error");
    }

    /** events = *(event_ | groupedEvent_ | phrase_) */
    private eventItem(): EventNode | undefined {
        return this.attempt(() => this.noteEvent())
            || this.attempt(() => this.degreeEvent())
            || this.attempt(() => this.repeatEvent())
            || this.attempt(() => this.repeatBarEvent())
            || this.attempt(() => this.chordEvent())
            || this.attempt(() => this.expressionEvent("\\"))
            || this.attempt(() => this.expressionEvent("!"))
            || this.attempt(() => this.restEvent())
            || this.attempt(() => this.multiMeasureRestEvent())
            || this.attempt(() => this.barLineEvent())
            || this.attempt(() => this.repeatEndEvent())
            || this.attempt(() => this.metaEvent())
            || this.attempt(() => this.groupEvent())
            || this.attempt(() => this.phraseEvent());
    }

    private tags(): Tag[] {
        return this.attempt(() => {
            if (!this.lit("\"")) {
                return undefined;
            }
            const tags: Tag[] = [];
            for (let m = this.re(TAG, "tag"); m; m = this.re(TAG, "tag")) {
                tags.push({ name: m.text, ...this.span(m.start, m.end) });
            }
            if (tags.length === 0 || !this.lit("\"") || !this.lit("@")) {
                return undefined;
            }
            return tags;
        }) || [];
    }

    private duration(): Duration | undefined {
        const m = this.re(DURATION, "duration");
        return m ? { value: m.text, ...this.span(m.start, m.end) } : undefined;
    }

    private octave(pitchStart: number, name: Match, kind: Pitch["kind"], forceDegree: boolean): Pitch {
        const oct = this.re(OCTAVE, "octave");
        const octave = !oct ? 0 : oct.text[0] === "'" ? oct.text.length : -oct.text.length;
        const octaveSpan = oct ? this.span(oct.start, oct.end) : this.span(name.end, name.end);
        return {
            kind, name: name.text, nameSpan: this.span(name.start, name.end), octave, octaveSpan, forceDegree,
            ...this.span(pitchStart, this.last),
        };
    }

    /** pitchOrAlias_ = pitch_ | alias_ | extendedPitch_ */
    private pitchOrAlias(): Pitch | undefined {
        this.skip();
        const start = this.p;
        const pitch = this.re(PITCH, "pitch");
        if (pitch) {
            return this.octave(start, pitch, "pitch", false);
        }
        const alias = this.re(ALIAS, "alias");
        if (alias) {
            const name = { text: alias.text.slice(1, -1), start: alias.start + 1, end: alias.end - 1 };
            return {
                kind: "alias", name: name.text, nameSpan: this.span(name.start, name.end), octave: 0,
                octaveSpan: this.span(name.end, name.end), forceDegree: false, ...this.span(start, alias.end),
            };
        }
        const ext = this.re(EXTENDED_PITCH, "extendedPitch");
        if (ext) {
            // the octave marks are part of the alias name (see valueParser.cpp)
            return {
                kind: "extendedPitch", name: ext.text, nameSpan: this.span(ext.start, ext.end), octave: 0,
                octaveSpan: this.span(ext.end, ext.end), forceDegree: false, ...this.span(start, ext.end),
            };
        }
        return undefined;
    }

    private degree(): Pitch | undefined {
        this.skip();
        const start = this.p;
        const force = this.lit("!", "forceDegree");
        const name = this.re(DEGREE, "degree");
        return name ? this.octave(start, name, "degree", force) : undefined;
    }

    private noteOrDegree(kind: "note" | "degree", pitch: () => Pitch | undefined): NoteEvent | undefined {
        this.skip();
        const start = this.p;
        const tags = this.tags();
        let pitches: Pitch[];
        let isChord = false;
        const single = this.attempt(pitch);
        if (single) {
            pitches = [single];
        } else if (this.lit("<")) {
            isChord = true;
            pitches = [];
            for (let x = this.attempt(pitch); x; x = this.attempt(pitch)) {
                pitches.push(x);
            }
            if (pitches.length === 0) {
                return undefined;
            }
            if (!this.lit(">")) {
                if (!this.fragmentEnd()) {
                    return undefined;
                }
                return this.node<NoteEvent>(start, {
                    kind, tags, pitches, isChord, tied: false, vorschlag: false,
                });
            }
        } else {
            return undefined;
        }
        const duration = this.duration();
        const tied = this.lit("~", "tie");
        const vorschlag = !tied && this.lit("->", "vorschlag");
        return this.node<NoteEvent>(start, { kind, tags, pitches, isChord, duration, tied, vorschlag });
    }

    private noteEvent() {
        return this.noteOrDegree("note", () => this.pitchOrAlias());
    }

    private degreeEvent() {
        return this.noteOrDegree("degree", () => this.degree());
    }

    private repeatEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        const tags = this.tags();
        if (!this.lit("&", "repeat")) {
            return undefined;
        }
        const duration = this.duration();
        const tied = this.lit("~", "tie");
        const vorschlag = !tied && this.lit("->", "vorschlag");
        return this.node<RepeatEvent>(start, {  kind: "repeat", tags, duration, tied, vorschlag });
    }

    private repeatBarEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        const tags = this.tags();
        if (!this.lit("%", "repeatBar")) {
            return undefined;
        }
        const duration = this.duration();
        return this.node<RepeatBarEvent>(start, {  kind: "repeatBar", tags, duration });
    }

    private chordEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        const tags = this.tags();
        const chord = this.re(CHORD, "chord");
        if (!chord) {
            return undefined;
        }
        return this.node<ChordEvent>(start, {  kind: "chord", tags, name: chord.text });
    }

    private expressionEvent(prefix: "\\" | "!"): EventNode | undefined {
        this.skip();
        const start = this.p;
        if (!this.lit(prefix)) {
            return undefined;
        }
        const value = this.re(EXPRESSION, "expression");
        if (!value) {
            return undefined;
        }
        return this.node<ExpressionEvent>(start, {  kind: "expression", tags: [], value: value.text, once: prefix === "!" });
    }

    private restEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        if (!this.lit("r", "rest")) {
            return undefined;
        }
        const duration = this.duration();
        return this.node<RestEvent>(start, {  kind: "rest", tags: [], duration });
    }

    private multiMeasureRestEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        if (!this.lit("=")) {
            return undefined;
        }
        const bars = this.re(INT, "number");
        if (!bars || !this.lit("=")) {
            return undefined;
        }
        return this.node<MultiMeasureRestEvent>(start, {  kind: "multiMeasureRest", tags: [], bars: parseInt(bars.text, 10) });
    }

    private volta(): string | undefined {
        // lexeme['^' >> +char_("0-9")]
        const m = this.re(VOLTA, "volta");
        return m ? m.text.substring(1) : undefined;
    }

    /** `|`, `|^1`, `|:` */
    private barLineEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        if (!this.lit("|", "barLine")) {
            return undefined;
        }
        const volta = this.volta();
        const repeatBegin = this.lit(":", "repeatSign");
        return this.node<BarLineEvent>(start, {
             kind: "barLine", tags: [], repeatBegin, repeatEnd: false, repeatCount: undefined, volta,
        });
    }

    /** `:|`, `:(x2)|`, `:|:` */
    private repeatEndEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        if (!this.lit(":", "repeatSign")) {
            return undefined;
        }
        const repeatCount = this.attempt(() => {
            if (!this.lit("(") || !this.lit("x")) {
                return undefined;
            }
            const n = this.re(INT, "number");
            if (!n || !this.lit(")")) {
                return undefined;
            }
            return parseInt(n.text, 10);
        });
        if (!this.lit("|", "barLine")) {
            return undefined;
        }
        const volta = this.volta();
        const repeatBegin = this.lit(":", "repeatSign");
        return this.node<BarLineEvent>(start, {
             kind: "barLine", tags: [], repeatBegin, repeatEnd: true, repeatCount, volta,
        });
    }

    private argument(): Argument | undefined {
        this.skip();
        const start = this.p;
        const name = this.attempt(() => {
            if (!this.lit("_", "argumentName")) {
                return undefined;
            }
            const n = this.skippingRun(ALNUM, "argumentName");
            return n && this.lit("=") ? n.text : undefined;
        });
        const quoted = this.re(QUOTED, "string");
        if (quoted) {
            return {
                name, value: quoted.text.slice(1, -1), valueSpan: this.span(quoted.start + 1, quoted.end - 1),
                ...this.span(start, quoted.end),
            };
        }
        const value = this.re(ARGUMENT_VALUE, "argumentValue");
        if (!value) {
            return undefined;
        }
        return { name, value: value.text, valueSpan: this.span(value.start, value.end), ...this.span(start, value.end) };
    }

    private arguments(): Argument[] {
        const args: Argument[] = [];
        for (let a = this.attempt(() => this.argument()); a; a = this.attempt(() => this.argument())) {
            args.push(a);
        }
        return args;
    }

    /** `/name: args/` */
    private metaEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        if (!this.lit("/")) {
            return undefined;
        }
        const partial = (name: string, args: Argument[]) =>
            this.fragmentEnd() ? this.node<MetaEvent>(start, {  kind: "meta", tags: [], name, args }) : undefined;
        const name = this.skippingRun(ALPHA, "identifier");
        if (!name) {
            return partial("", []);
        }
        if (!this.lit(":")) {
            return partial(name.text, []);
        }
        const args = this.arguments();
        if (args.length === 0) {
            return partial(name.text, []);
        }
        if (!this.lit("/")) {
            return partial(name.text, args);
        }
        return this.node<MetaEvent>(start, {  kind: "meta", tags: [], name: name.text, args });
    }

    /** `"tag"@(events)4` */
    private groupEvent(): GroupEvent | undefined {
        this.skip();
        const start = this.p;
        const tags = this.tags();
        if (!this.lit("(")) {
            return undefined;
        }
        const { events, closed } = this.eventList(")", "[]{};");
        if (!closed) {
            this.unclosed(")", start);
            return this.node<GroupEvent>(start, { kind: "group", tags, events, closed });
        }
        const duration = this.duration();
        return this.node<GroupEvent>(start, { kind: "group", tags, events, duration, closed });
    }

    /** `>"name"4~` or `>>"name"` */
    private phraseEvent(): EventNode | undefined {
        this.skip();
        const start = this.p;
        const tags = this.tags();
        let stretched: boolean;
        if (this.lit(">>")) {
            stretched = false;
        } else if (this.lit(">")) {
            stretched = true;
        } else {
            return undefined;
        }
        const name = this.re(PHRASE_NAME, "phraseName");
        if (!name) {
            return undefined;
        }
        const duration = this.duration();
        const tied = this.lit("~", "tie");
        return this.node<PhraseEvent>(start, {
             kind: "phrase", tags, name: name.text.slice(1, -1), stretched, duration, tied,
        });
    }
}
