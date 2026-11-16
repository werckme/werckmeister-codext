import * as assert from "assert";
import { applyEdits, parseDocument, transposeOctave } from "../src";

/**
 * `«` and `»` mark the selection. Returns the transposed document (without markers).
 */
function transpose(marked: string, direction: 1 | -1, fragment = false): string {
    const start = marked.indexOf("«");
    const end = marked.indexOf("»") - 1;
    const doc = marked.replace("«", "").replace("»", "");
    if (fragment) {
        const selected = doc.substring(start, end);
        const { edits } = transposeOctave(selected, direction, { fragment: true });
        return doc.substring(0, start) + applyEdits(selected, edits) + doc.substring(end);
    }
    const { edits } = transposeOctave(doc, direction, { range: { start, end } });
    return applyEdits(doc, edits);
}

/** [name, document with selection, expected up, expected down, document mode only] */
const cases: [string, string, string, string, boolean?][] = [
    ["single notes and degrees",
        "[{ «c I» }]",
        "[{ c' I' }]",
        "[{ c, I, }]"],

    ["existing octave marks",
        "[{ «c' c'' d, d,,» }]",
        "[{ c'' c''' d d, }]",
        "[{ c c' d,, d,,, }]"],

    ["accidentals, durations, ties, vorschlag",
        "[{ «c#4. eb,8~ f#-> IIb4 !V'» }]",
        "[{ c#'4. eb8~ f#'-> IIb'4 !V'' }]",
        "[{ c#,4. eb,,8~ f#,-> IIb,4 !V }]"],

    ["multiple bars",
        "[{ c «d e | f g | a» b }]",
        "[{ c d' e' | f' g' | a' b }]",
        "[{ c d, e, | f, g, | a, b }]"],

    ["multiple lines",
        "[{\n  c «d e |\n  f g |\n  a» b\n}]",
        "[{\n  c d' e' |\n  f' g' |\n  a' b\n}]",
        "[{\n  c d, e, |\n  f, g, |\n  a, b\n}]"],

    ["between two voices",
        "[\n{\n -- from here\n «c d\n}\n{\n  e f\n  -- to here»\n}\n]",
        "[\n{\n -- from here\n c' d'\n}\n{\n  e' f'\n  -- to here\n}\n]",
        "[\n{\n -- from here\n c, d,\n}\n{\n  e, f,\n  -- to here\n}\n]"],

    ["mixed events: expressions (volume), meta events, chords, rests",
        "[{ «\\p c !ff d /cc: 7 100/ e /fade: _from=0 _to=100/ C7 r4 =2= & % f» }]",
        "[{ \\p c' !ff d' /cc: 7 100/ e' /fade: _from=0 _to=100/ C7 r4 =2= & % f' }]",
        "[{ \\p c, !ff d, /cc: 7 100/ e, /fade: _from=0 _to=100/ C7 r4 =2= & % f, }]"],

    ["tagged events",
        "[{ «\"myTag\"@I \"a b\"@c' \"t\"@<c e>» }]",
        "[{ \"myTag\"@I' \"a b\"@c'' \"t\"@<c' e'> }]",
        "[{ \"myTag\"@I, \"a b\"@c \"t\"@<c, e,> }]"],

    ["chords and groups",
        "[{ «<c e, g'>4 (c d (e)8)4» }]",
        "[{ <c' e g''>4 (c' d' (e')8)4 }]",
        "[{ <c, e,, g>4 (c, d, (e,)8)4 }]"],

    ["aliases and extended pitches are not transposed",
        "[{ «\"bd\" x <\"sn\" c>» }]",
        "[{ \"bd\" x <\"sn\" c'> }]",
        "[{ \"bd\" x <\"sn\" c,> }]"],

    ["comments are not touched",
        "[{ «c -- d e\n /* f */ g» }]",
        "[{ c' -- d e\n /* f */ g' }]",
        "[{ c, -- d e\n /* f */ g, }]"],

    ["octave limit: notes at the limit are skipped",
        "[{ «c''''' c, d,,,,, d'» }]",
        "[{ c''''' c d,,,, d'' }]",
        "[{ c'''' c,, d,,,,, d }]"],

    ["octave limit inside a chord: only the pitch at the limit is skipped",
        "[{ «<c''''' e g,,,,,>» }]",
        "[{ <c''''' e' g,,,,> }]",
        "[{ <c'''' e, g,,,,,> }]"],

    ["octave limit for degrees",
        "[{ «I''''' II,,,,,» }]",
        "[{ I''''' II,,,, }]",
        "[{ I'''' II,,,,, }]"],

    ["partially selected note",
        "[{ c d«' e» f }]",
        "[{ c d'' e' f }]",
        "[{ c d e, f }]",
        true], // the fragment "' e" does not contain the pitch name

    ["octave written with whitespace (c ')",
        "[{ «c ' 4» }]",
        "[{ c '' 4 }]",
        "[{ c  4 }]"],
];

describe("transpose octave", () => {
    for (const [name, marked, up, down, documentOnly] of cases) {
        describe(name, () => {
            it("up", () => assert.strictEqual(transpose(marked, 1), up));
            it("down", () => assert.strictEqual(transpose(marked, -1), down));
            if (!documentOnly) {
                it("up (fragment)", () => assert.strictEqual(transpose(marked, 1, true), up));
                it("down (fragment)", () => assert.strictEqual(transpose(marked, -1, true), down));
            }
            it("result is still valid", () => {
                assert.deepStrictEqual(parseDocument(transpose(marked, 1)).errors, []);
                assert.deepStrictEqual(parseDocument(transpose(marked, -1)).errors, []);
            });
        });
    }

    it("reports skipped pitches", () => {
        const { edits, skipped } = transposeOctave("[{ c''''' d }]", 1);
        assert.strictEqual(edits.length, 1);
        assert.deepStrictEqual(skipped.map(p => p.name), ["c"]);
    });

    it("up and down again gives the original text", () => {
        const src = "[{ c d' e, \"t\"@<f g'' a,,>4 I II' | /cc: 1 2/ b }]";
        const up = applyEdits(src, transposeOctave(src, 1).edits);
        assert.strictEqual(applyEdits(up, transposeOctave(up, -1).edits), src);
    });

    it("without range: whole document", () => {
        const src = "p = c;\n[{ d }]";
        assert.strictEqual(applyEdits(src, transposeOctave(src, 1).edits), "p = c';\n[{ d' }]");
    });
});
