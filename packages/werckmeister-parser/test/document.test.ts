import * as assert from "assert";
import { parseDocument, TrackNode } from "../src";
import { brief, textOf } from "./helpers";

function briefDoc(src: string): string[] {
    return parseDocument(src).root.items.map(brief);
}

describe("document", () => {
    it("empty document", () => {
        const result = parseDocument("");
        assert.deepStrictEqual(result.root.items, []);
        assert.deepStrictEqual(result.errors, []);
    });

    it("usings", () => {
        assert.deepStrictEqual(
            briefDoc("using \"./chords/default.chords\";\nusing \"lua/voicings/guitar.lua\" ;"),
            ["using:\"./chords/default.chords\"", "using:\"lua/voicings/guitar.lua\""]);
    });

    it("document configs", () => {
        assert.deepStrictEqual(
            briefDoc("tempo: 140;\ndevice: MyDevice  midi _usePort=0;\ninstrumentDef:lead _onDevice=MyDevice _ch=0 _pc=0;"),
            ["config:tempo: 140;", "config:device: MyDevice midi _usePort=0;",
             "config:instrumentDef: lead _onDevice=MyDevice _ch=0 _pc=0;"]);
    });

    it("config with quoted argument", () => {
        assert.deepStrictEqual(briefDoc("instrumentDef: p _onDevice=\"My Device\";"),
            ["config:instrumentDef: p _onDevice=My Device;"]);
    });

    it("phrase definitions", () => {
        assert.deepStrictEqual(briefDoc("myPhrase_1 = c d \"t\"@e f;"),
            ["phraseDef:myPhrase_1 = note:c note:d note:\"t\"@e note:f;"]);
    });

    it("track with configs and voices", () => {
        const src = "[\ninstrument: piano;\ntype: template;\n{\n c d\n}\n{\n e f\n}\n]";
        assert.deepStrictEqual(briefDoc(src), [
            "track:[config:instrument: piano; config:type: template; voice:{note:c note:d} voice:{note:e note:f}]",
        ]);
    });

    it("mixed order of top level items", () => {
        const src = `
using "a.lua";
tempo: 120;
[ { c } ]
p = d;
using "b.lua";
[ { e } ]`;
        assert.deepStrictEqual(briefDoc(src), [
            "using:\"a.lua\"", "config:tempo: 120;", "track:[voice:{note:c}]",
            "phraseDef:p = note:d;", "using:\"b.lua\"", "track:[voice:{note:e}]",
        ]);
    });

    it("track and voice spans", () => {
        const src = "x: 1;\n[ a: b; { c } ]";
        const track = parseDocument(src).root.items[1] as TrackNode;
        assert.strictEqual(textOf(src, track), "[ a: b; { c } ]");
        assert.strictEqual(textOf(src, track.voices[0]), "{ c }");
        assert.strictEqual(textOf(src, track.configs[0]), "a: b;");
        assert.strictEqual(textOf(src, track.configs[0].nameSpan), "a");
    });

    it("realistic sheet", () => {
        const src = `using "./chords/default.chords";
using "./lua/voicings/guitar.lua";

device: MyDevice  midi _usePort=0;
instrumentDef: piano _ch=0 _pc=0 _onDevice=MyDevice;

[
type: template;
name: myTemplate;
instrument: piano;
{
    /signature: 3 4/
    \\ff
    I# Ib, | "x"@<I III V>4. r8 :|
}
]

[
type: accomp;
{
    /template: myTemplate/
    A | Bb7 | % | =2= |
}
]
`;
        const result = parseDocument(src);
        assert.deepStrictEqual(result.errors, []);
        assert.deepStrictEqual(result.root.items.map(brief), [
            "using:\"./chords/default.chords\"",
            "using:\"./lua/voicings/guitar.lua\"",
            "config:device: MyDevice midi _usePort=0;",
            "config:instrumentDef: piano _ch=0 _pc=0 _onDevice=MyDevice;",
            "track:[config:type: template; config:name: myTemplate; config:instrument: piano; voice:{"
                + "meta:/signature: 3 4/ expression:\\ff degree:I# degree:Ib, barLine:| "
                + "degree:\"x\"@<I III V>4. rest:r8 barLine::|}]",
            "track:[config:type: accomp; voice:{meta:/template: myTemplate/ chord:A barLine:| chord:Bb7 barLine:| "
                + "repeatBar:% barLine:| multiMeasureRest:=2= barLine:|}]",
        ]);
    });

    describe("syntax errors", () => {
        const invalid: [string, string][] = [
            ["track without voice", "[ instrument: piano; ]"],
            ["unclosed track", "[ { c }"],
            ["unclosed voice", "[ { c ]"],
            ["config without arguments", "tempo: ;"],
            ["config without semicolon", "tempo: 120"],
            ["events at top level", "c d e"],
            ["voice outside of a track", "{ c }"],
            ["unclosed group", "[ { (c d } ]"],
            ["using without quotes", "using a.lua;"],
            ["unclosed meta event", "[ { /cc: 1 2 } ]"],
        ];
        for (const [name, src] of invalid) {
            it(name, () => {
                const result = parseDocument(src);
                assert.ok(result.errors.length > 0, "error expected");
                for (const e of result.errors) {
                    assert.ok(e.start >= 0 && e.end <= src.length && e.start <= e.end, "error span in range");
                    assert.ok(e.message.length > 0);
                }
            });
        }

        it("recovers: items after an error are still parsed", () => {
            const src = "tempo: ;\n[ { c } ]";
            const result = parseDocument(src);
            assert.ok(result.errors.length > 0);
            const track = result.root.items.find(i => i.kind === "track");
            assert.ok(track, "track expected");
            assert.strictEqual(brief(track!), "track:[voice:{note:c}]");
        });

        it("recovers inside a voice", () => {
            const src = "[ { c $ d } { e } ]";
            const result = parseDocument(src);
            assert.ok(result.errors.length > 0);
            assert.strictEqual(brief(result.root.items[0]), "track:[voice:{note:c error note:d} voice:{note:e}]");
        });
    });
});
