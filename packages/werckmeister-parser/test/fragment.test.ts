import * as assert from "assert";
import { eventsInRange, parseDocument, parseFragment, EventNode, forEachEvent } from "../src";
import { brief, briefFragment, textOf } from "./helpers";

/** all note/degree events in brief notation */
function noteEvents(events: EventNode[]): string[] {
    return events.filter(e => e.kind === "note" || e.kind === "degree").map(brief);
}

function allEvents(src: string): EventNode[] {
    const result: EventNode[] = [];
    forEachEvent(parseFragment(src).root, e => result.push(e));
    return result;
}

/**
 * Document used for the selection tests. `«` and `»` mark the selection,
 * they are removed before parsing.
 */
function selection(marked: string): { doc: string; range: { start: number; end: number }; text: string } {
    const start = marked.indexOf("«");
    const end = marked.indexOf("»") - 1;
    const doc = marked.replace("«", "").replace("»", "");
    return { doc, range: { start, end }, text: doc.substring(start, end) };
}

/** the scenarios of the "Octave Transpose Selection" task */
const scenarios: [string, string, string[]][] = [
    ["multiple bars", `
[
{
    c d «e f | g a b c' | c'' d» e f
}
]`, ["note:e", "note:f", "note:g", "note:a", "note:b", "note:c'", "note:c''", "note:d"]],

    ["multiple lines", `
[
{
    c «d e f |
    g a b c' |
    c''» d
}
]`, ["note:d", "note:e", "note:f", "note:g", "note:a", "note:b", "note:c'", "note:c''"]],

    ["between two voices", `
[
{
    c «d
}
{
    e» f
}
]`, ["note:d", "note:e"]],

    ["between two tracks", `
[
instrument: a;
{
    c «d
}
]
[
instrument: b;
{
    e» f
}
]`, ["note:d", "note:e"]],

    ["mixed events: volume / expression / meta / chords / rests", `
[
{
    «\\ppp c /cc: 7 100/ d !ff <e g>4 r /fade: _from=0 _to=100/ =2= C7 f»
}
]`, ["note:c", "note:d", "note:<e g>4", "note:f"]],

    ["tagged events", `
[
{
    «"myTag"@I "a b"@<c e> "t"@(d e)4 "t"@&»
}
]`, ["degree:\"myTag\"@I", "note:\"a b\"@<c e>", "note:d", "note:e"]],

    ["degrees", `
[
{
    «I II, !III' <I III V>4. IV#''»
}
]`, ["degree:I", "degree:II,", "degree:!III'", "degree:<I III V>4.", "degree:IV#''"]],

    ["with comments", `
[
{
    «c -- d e
    f /* g */ a»
}
]`, ["note:c", "note:f", "note:a"]],

    ["phrase definition", `
«myPhrase = c d e;»
[
{
    >"myPhrase"
}
]`, ["note:c", "note:d", "note:e"]],
];

describe("fragments / selections", () => {
    describe("parseFragment on the selected text", () => {
        for (const [name, marked, expected] of scenarios) {
            it(name, () => {
                const { text, range } = selection(marked);
                const result = parseFragment(text, { offset: range.start });
                assert.deepStrictEqual(result.errors, []);
                const events: EventNode[] = [];
                forEachEvent(result.root, e => events.push(e));
                assert.deepStrictEqual(noteEvents(events), expected);
            });
        }
    });

    describe("parseDocument + eventsInRange (selection inside a whole document)", () => {
        for (const [name, marked, expected] of scenarios) {
            it(name, () => {
                const { doc, range } = selection(marked);
                const result = parseDocument(doc);
                assert.deepStrictEqual(result.errors, []);
                assert.deepStrictEqual(noteEvents(eventsInRange(result.root, range)), expected);
            });
        }

        it("a partially selected event counts", () => {
            const { doc, range } = selection("[ { c d'«' e» } ]");
            assert.deepStrictEqual(noteEvents(eventsInRange(parseDocument(doc).root, range)), ["note:d''", "note:e"]);
        });

        it("empty selection (cursor) returns the event at the cursor", () => {
            const { doc, range } = selection("[ { c d«»' e } ]");
            assert.deepStrictEqual(noteEvents(eventsInRange(parseDocument(doc).root, range)), ["note:d'"]);
        });

        it("selection inside a meta event does not yield notes", () => {
            const { doc, range } = selection("[ { c /cc: «7 1»00/ d } ]");
            assert.deepStrictEqual(noteEvents(eventsInRange(parseDocument(doc).root, range)), []);
        });
    });

    describe("structure of fragments", () => {
        it("unbalanced closing and opening brackets", () => {
            assert.deepStrictEqual(briefFragment("c d\n}\n{\ne f"),
                ["note:c", "note:d", "delimiter:}", "voice:{note:e note:f"]);
        });

        it("across tracks", () => {
            assert.deepStrictEqual(briefFragment("c } ] [ instrument: x; { d"),
                ["note:c", "delimiter:}", "delimiter:]", "track:[config:instrument: x; voice:{note:d"]);
        });

        it("complete track inside a fragment", () => {
            assert.deepStrictEqual(briefFragment("[ { c } ]"), ["track:[voice:{note:c}]"]);
        });

        it("document level items inside a fragment", () => {
            assert.deepStrictEqual(briefFragment("using \"a.lua\"; tempo: 120; p = c;"),
                ["using:\"a.lua\"", "config:tempo: 120;", "phraseDef:p = note:c;"]);
        });

        it("unclosed group", () => {
            assert.deepStrictEqual(briefFragment("c (d e"), ["note:c", "group:(note:d note:e"]);
        });

        it("unclosed phrase definition", () => {
            assert.deepStrictEqual(briefFragment("p = c d"), ["phraseDef:p = note:c note:d"]);
        });

        it("unclosed things at the end of a fragment are no errors", () => {
            for (const src of ["{ c", "[ { c", "(c", "p = c", "[ instrument: x;"]) {
                assert.deepStrictEqual(parseFragment(src).errors, [], src);
            }
        });
    });

    describe("fragments starting or ending inside an event (best effort)", () => {
        it("starting with octave marks of a cut off pitch", () => {
            const events = allEvents("'4 d e");
            assert.deepStrictEqual(noteEvents(events), ["note:d", "note:e"]);
            assert.strictEqual(events[0].kind, "error");
        });

        it("starting with the rest of a meta event", () => {
            const events = allEvents("100/ d e");
            assert.deepStrictEqual(noteEvents(events).slice(-2), ["note:d", "note:e"]);
        });

        it("starting inside a meta event incl. its name", () => {
            const events = allEvents("cc: 7 100/ c d");
            assert.deepStrictEqual(events.map(brief), ["meta:/cc: 7 100/", "note:c", "note:d"]);
        });

        it("a normal fragment with a meta event is not taken for a meta tail", () => {
            assert.deepStrictEqual(allEvents("c d /cc: 1/ e").map(brief),
                ["note:c", "note:d", "meta:/cc: 1/", "note:e"]);
        });

        it("starting inside a block comment", () => {
            const src = "x y */ c d";
            assert.deepStrictEqual(allEvents(src).map(brief), ["note:c", "note:d"]);
            assert.deepStrictEqual(parseFragment(src).errors, []);
        });

        it("ending inside a meta event", () => {
            const src = "c d /cc: 7";
            const events = allEvents(src);
            assert.deepStrictEqual(noteEvents(events), ["note:c", "note:d"]);
            assert.strictEqual(textOf(src, events[2]), "/cc: 7");
        });

        it("ending inside a tag", () => {
            assert.deepStrictEqual(noteEvents(allEvents("c d \"my")), ["note:c", "note:d"]);
        });

        it("starting inside a tag", () => {
            assert.deepStrictEqual(noteEvents(allEvents("Tag\"@c d")).slice(-2), ["note:c", "note:d"]);
        });

        it("ending inside a chord (unclosed at the end is accepted)", () => {
            assert.deepStrictEqual(noteEvents(allEvents("c <d e")), ["note:c", "note:<d e>"]);
        });
    });
});
