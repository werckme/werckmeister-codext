import * as assert from "assert";
import { parseFragment } from "../src";
import { briefFragment } from "./helpers";

/**
 * [input, expected events in brief notation (see helpers.brief)]
 * Every input here is valid werckmeister code (verified with `sheetc --mode=validate`).
 */
type Case = [string, string[]];

function table(cases: Case[]) {
    for (const [src, expected] of cases) {
        it(JSON.stringify(src), () => {
            const result = parseFragment(src);
            assert.deepStrictEqual(result.errors, [], "no errors expected");
            assert.deepStrictEqual(briefFragment(src), expected);
        });
    }
}

describe("events", () => {
    describe("notes", () => {
        table([
            ["c", ["note:c"]],
            ["c d e", ["note:c", "note:d", "note:e"]],
            ["c4", ["note:c4"]],
            ["c' c'' c''''' c, c,, c,,,,,", ["note:c'", "note:c''", "note:c'''''", "note:c,", "note:c,,", "note:c,,,,,"]],
            ["c#, db' eb fb e# f# gb g# ab a# bb b cb b#",
                ["note:c#,", "note:db'", "note:eb", "note:fb", "note:e#", "note:f#", "note:gb", "note:g#",
                 "note:ab", "note:a#", "note:bb", "note:b", "note:cb", "note:b#"]],
            ["c'8.", ["note:c'8."]],
            ["c1 c2 c4 c8 c16 c32 c64 c128", ["note:c1", "note:c2", "note:c4", "note:c8", "note:c16", "note:c32", "note:c64", "note:c128"]],
            ["c4. c4.. c4... c1....", ["note:c4.", "note:c4..", "note:c4...", "note:c1...."]],
            ["c8t c4n5 c16n7 c128n9", ["note:c8t", "note:c4n5", "note:c16n7", "note:c128n9"]],
            ["c4~ c", ["note:c4~", "note:c"]],
            ["c-> d", ["note:c->", "note:d"]],
            ["<c e g>4", ["note:<c e g>4"]],
            ["<c, e' g>4.~", ["note:<c, e' g>4.~"]],
            ["\"bd\"4", ["note:\"bd\"4"]],
            ["\"bass drum\" \"sn\"8", ["note:\"bass drum\"", "note:\"sn\"8"]],
            ["<\"bd\" \"hh\">4", ["note:<\"bd\" \"hh\">4"]],
            ["x4 h', y,,", ["note:x4", "note:h',", "note:y,,"]],
        ]);
    });

    describe("degrees", () => {
        table([
            ["I II III IV V VI VII", ["degree:I", "degree:II", "degree:III", "degree:IV", "degree:V", "degree:VI", "degree:VII"]],
            ["I# IIb III## IVbb V### VIbbb", ["degree:I#", "degree:IIb", "degree:III##", "degree:IVbb", "degree:V###", "degree:VIbbb"]],
            ["I' II,, VII'''4.", ["degree:I'", "degree:II,,", "degree:VII'''4."]],
            ["!I !V,8", ["degree:!I", "degree:!V,8"]],
            ["<I III V>2~", ["degree:<I III V>2~"]],
            ["I-> II", ["degree:I->", "degree:II"]],
        ]);
    });

    describe("tags", () => {
        table([
            ["\"t\"@c", ["note:\"t\"@c"]],
            ["\"t1 t2\"@c'4", ["note:\"t1 t2\"@c'4"]],
            ["\"a\" @ c", ["note:\"a\"@c"]],
            ["\"t\"@I", ["degree:\"t\"@I"]],
            ["\"t\"@<c e>", ["note:\"t\"@<c e>"]],
            ["\"t\"@C", ["chord:\"t\"@C"]],
            ["\"t\"@&", ["repeat:\"t\"@&"]],
            ["\"t\"@%", ["repeatBar:\"t\"@%"]],
            ["\"t\"@>\"p\"", ["phrase:\"t\"@>\"p\""]],
            ["\"t\"@(c d)4", ["group:\"t\"@(note:c note:d)4"]],
            ["\"a-b_c.d!?\"@c", ["note:\"a-b_c.d!?\"@c"]],
        ]);
    });

    describe("other events", () => {
        table([
            ["r r4 r8.", ["rest:r", "rest:r4", "rest:r8."]],
            ["& &4 &~ &->", ["repeat:&", "repeat:&4", "repeat:&~", "repeat:&->"]],
            ["% %1", ["repeatBar:%", "repeatBar:%1"]],
            ["=4= = 12 =", ["multiMeasureRest:=4=", "multiMeasureRest:=12="]],
            ["C Cmaj7 D-7/C F#7#9 Bb7", ["chord:C", "chord:Cmaj7", "chord:D-7/C", "chord:F#7#9", "chord:Bb7"]],
            ["\\p \\ppppp \\fff", ["expression:\\p", "expression:\\ppppp", "expression:\\fff"]],
            ["!f !pp", ["expression:!f", "expression:!pp"]],
            [">\"myPhrase\" >>\"myPhrase\"4 >\"p_1\"~", ["phrase:>\"myPhrase\"", "phrase:>>\"myPhrase\"4", "phrase:>\"p_1\"~"]],
            ["(c d e)4", ["group:(note:c note:d note:e)4"]],
            ["(c (d e)8)4", ["group:(note:c group:(note:d note:e)8)4"]],
            ["(c >\"p\" \"t\"@(d))", ["group:(note:c phrase:>\"p\" group:\"t\"@(note:d))"]],
        ]);
    });

    describe("bar lines", () => {
        table([
            ["|", ["barLine:|"]],
            ["|^1", ["barLine:|^1"]],
            ["| ^12", ["barLine:|^12"]],
            ["|:", ["barLine:|:"]],
            [":|", ["barLine::|"]],
            [":(x2)|", ["barLine::(x2)|"]],
            [":|:", ["barLine::|:"]],
            [": ( x 3 ) |", ["barLine::(x3)|"]],
            ["c | ^1 d :| e |: f :(x2)| g :|: a",
                ["note:c", "barLine:|^1", "note:d", "barLine::|", "note:e", "barLine:|:",
                 "note:f", "barLine::(x2)|", "note:g", "barLine::|:", "note:a"]],
        ]);
    });

    describe("meta events", () => {
        table([
            ["/tempo: 120/", ["meta:/tempo: 120/"]],
            ["/cc: 7 100/", ["meta:/cc: 7 100/"]],
            ["/signature: 3 4/", ["meta:/signature: 3 4/"]],
            ["/fade: _from=0 _to=100 _curve=lin/", ["meta:/fade: _from=0 _to=100 _curve=lin/"]],
            ["/cc: _name=\"Modulation\"  _value=0/", ["meta:/cc: _name=Modulation _value=0/"]],
            ["/instrument: piano/", ["meta:/instrument: piano/"]],
            ["/tempo: 0.5/", ["meta:/tempo: 0.5/"]],
            ["c /cc: 7 100/ d", ["note:c", "meta:/cc: 7 100/", "note:d"]],
            ["/ cc : _ nr = 7 _value=100 /", ["meta:/cc: _nr=7 _value=100/"]],
        ]);
    });

    describe("spirit quirks (whitespace skipping, longest match, alternative order)", () => {
        table([
            // the skipper allows whitespace between pitch, octave, duration and tie
            ["c 4 d", ["note:c4", "note:d"]],
            ["c ' 4 ~", ["note:c'4~"]],
            ["< c e g > 4", ["note:<c e g>4"]],
            // symbol tables use longest match
            ["eb", ["note:eb"]],
            ["e b", ["note:e", "note:b"]],
            ["IV I V", ["degree:IV", "degree:I", "degree:V"]],
            ["c16", ["note:c16"]],
            ["c''", ["note:c''"]],
            // `!` is a forced degree if a degree follows, an expression otherwise
            ["!I !f", ["degree:!I", "expression:!f"]],
            // `"x"` is an alias unless followed by `@`
            ["\"x\" c", ["note:\"x\"", "note:c"]],
            // uppercase letters A-G start a chord, lowercase a pitch
            ["C c", ["chord:C", "note:c"]],
            // a chord name ends at whitespace or a non chord character
            ["C7/G d", ["chord:C7/G", "note:d"]],
            ["C|", ["chord:C", "barLine:|"]],
            // no whitespace needed between events
            ["c'd,e", ["note:c'", "note:d,", "note:e"]],
            ["c|d", ["note:c", "barLine:|", "note:d"]],
        ]);
    });

    describe("invalid events", () => {
        const invalid: string[] = [
            "cmaj7",        // lowercase chords do not exist
            "c ,,,,,, c",   // max 5 octave marks
            "\"t\"@r",      // rests can not be tagged
            "c; d",         // `;` is not allowed in a voice
            "c # d",        // accidentals are part of the pitch symbol, no whitespace allowed
            "c4 4",         // only one duration
            "/cc 7/",       // missing `:`
            "/cc: -1/",     // `-` is not allowed in unquoted argument values
        ];
        for (const src of invalid) {
            it(`reports an error for ${JSON.stringify(src)}`, () => {
                const result = parseFragment(`{ ${src} }`);
                assert.ok(result.errors.length > 0, "error expected");
            });
        }

        it("continues after an error", () => {
            const result = parseFragment("c $$ d");
            assert.ok(result.errors.length > 0);
            assert.deepStrictEqual(briefFragment("c $$ d"), ["note:c", "error", "note:d"]);
        });

        it("error node spans the unparsable text", () => {
            const src = "c $$ d";
            const err = parseFragment(src).root.items[1];
            assert.strictEqual(err.kind, "error");
            assert.strictEqual(src.substring(err.start, err.end), "$$");
        });
    });
});
