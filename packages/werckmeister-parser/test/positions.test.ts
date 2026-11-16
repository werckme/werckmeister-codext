import * as assert from "assert";
import { NoteEvent, parseFragment, forEachEvent, EventNode } from "../src";
import { textOf } from "./helpers";

function notes(src: string, offset = 0): NoteEvent[] {
    const result: NoteEvent[] = [];
    forEachEvent(parseFragment(src, { offset }).root, e => {
        if (e.kind === "note" || e.kind === "degree") {
            result.push(e);
        }
    });
    return result;
}

describe("positions", () => {
    it("event span covers the event text without surrounding whitespace", () => {
        const src = "  \"t\"@c'4~  d  ";
        const [first, second] = parseFragment(src).root.items as EventNode[];
        assert.strictEqual(textOf(src, first), "\"t\"@c'4~");
        assert.strictEqual(textOf(src, second), "d");
    });

    it("pitch name and octave spans", () => {
        const src = "c#'' d,4 e";
        const [a, b, c] = notes(src).map(n => n.pitches[0]);
        assert.strictEqual(textOf(src, a.nameSpan), "c#");
        assert.strictEqual(textOf(src, a.octaveSpan), "''");
        assert.strictEqual(a.octave, 2);
        assert.strictEqual(textOf(src, b.nameSpan), "d");
        assert.strictEqual(textOf(src, b.octaveSpan), ",");
        assert.strictEqual(b.octave, -1);
        assert.strictEqual(textOf(src, c.nameSpan), "e");
        assert.strictEqual(c.octave, 0);
    });

    it("missing octave is an empty span directly behind the pitch name (insertion point)", () => {
        const src = "c4 I8";
        const [c, one] = notes(src).map(n => n.pitches[0]);
        assert.deepStrictEqual(c.octaveSpan, { start: 1, end: 1 });
        assert.deepStrictEqual(one.octaveSpan, { start: 4, end: 4 });
    });

    it("octave separated by whitespace (spirit skipper)", () => {
        const src = "c '' 4";
        const p = notes(src)[0].pitches[0];
        assert.strictEqual(textOf(src, p.octaveSpan), "''");
        assert.strictEqual(p.octave, 2);
    });

    it("degree spans, incl. forced degree", () => {
        const src = "!VII#,,";
        const p = notes(src)[0].pitches[0];
        assert.strictEqual(p.kind, "degree");
        assert.strictEqual(p.forceDegree, true);
        assert.strictEqual(textOf(src, p.nameSpan), "VII#");
        assert.strictEqual(textOf(src, p.octaveSpan), ",,");
        assert.strictEqual(p.octave, -2);
    });

    it("every pitch of a chord has its own spans", () => {
        const src = "<c, e g'>4";
        const ps = notes(src)[0].pitches;
        assert.deepStrictEqual(ps.map(p => textOf(src, p.nameSpan)), ["c", "e", "g"]);
        assert.deepStrictEqual(ps.map(p => textOf(src, p.octaveSpan)), [",", "", "'"]);
        assert.deepStrictEqual(ps.map(p => p.octave), [-1, 0, 1]);
    });

    it("alias pitch: name without quotes, no octave", () => {
        const src = "\"bass drum\"4";
        const p = notes(src)[0].pitches[0];
        assert.strictEqual(p.kind, "alias");
        assert.strictEqual(p.name, "bass drum");
        assert.strictEqual(textOf(src, p.nameSpan), "bass drum");
        assert.strictEqual(p.octave, 0);
    });

    it("tag spans", () => {
        const src = "\"t1  t2\"@c";
        const t = notes(src)[0].tags;
        assert.deepStrictEqual(t.map(x => x.name), ["t1", "t2"]);
        assert.deepStrictEqual(t.map(x => textOf(src, x)), ["t1", "t2"]);
    });

    it("duration span", () => {
        const src = "c' 8.";
        const d = notes(src)[0].duration!;
        assert.strictEqual(d.value, "8.");
        assert.strictEqual(textOf(src, d), "8.");
    });

    it("notes inside groups", () => {
        const src = "(c (d' e)8)4";
        assert.deepStrictEqual(notes(src).map(n => textOf(src, n)), ["c", "d'", "e"]);
    });

    it("meta argument spans", () => {
        const src = "/cc: _nr=7 \"a b\"/";
        const meta = parseFragment(src).root.items[0];
        assert.strictEqual(meta.kind, "meta");
        if (meta.kind === "meta") {
            assert.deepStrictEqual(meta.args.map(a => textOf(src, a.valueSpan)), ["7", "a b"]);
            assert.deepStrictEqual(meta.args.map(a => textOf(src, a)), ["_nr=7", "\"a b\""]);
        }
    });

    describe("offset option", () => {
        it("shifts all spans", () => {
            const doc = "{ c d' e }";
            const selection = { start: 4, end: 8 }; // "d' e"
            const sel = doc.substring(selection.start, selection.end);
            const ns = notes(sel, selection.start);
            assert.deepStrictEqual(ns.map(n => textOf(doc, n)), ["d'", "e"]);
            assert.deepStrictEqual(ns.map(n => textOf(doc, n.pitches[0].octaveSpan)), ["'", ""]);
        });

        it("shifts token and error spans", () => {
            const result = parseFragment("c $", { offset: 100 });
            assert.strictEqual(result.tokens[0].start, 100);
            assert.strictEqual(result.errors[0].start, 102);
        });
    });
});
