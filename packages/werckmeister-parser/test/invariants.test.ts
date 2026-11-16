import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { parseDocument, parseFragment, forEachEvent, EventNode, ParseResult, AnyNode, DocumentNode } from "../src";
import { brief, corpusFiles, prng } from "./helpers";

/** the token stream covers the input completely, without gaps or overlaps */
function assertLossless(src: string, result: ParseResult<AnyNode>, offset = 0) {
    let pos = offset;
    for (const t of result.tokens) {
        assert.strictEqual(t.start, pos, `token gap/overlap at ${pos}`);
        assert.ok(t.end > t.start, `empty token at ${pos}`);
        pos = t.end;
    }
    assert.strictEqual(pos, offset + src.length, "tokens do not cover the whole input");
}

/** every span lies within [offset, offset + length] and inside the span of its parent node */
function assertSpans(src: string, result: ParseResult<AnyNode>, offset = 0) {
    const visit = (value: unknown, parent: { start: number; end: number }, where: string) => {
        if (Array.isArray(value)) {
            value.forEach((v, i) => visit(v, parent, `${where}[${i}]`));
            return;
        }
        if (!value || typeof value !== "object") {
            return;
        }
        const obj = value as { [key: string]: unknown };
        let self = parent;
        if (typeof obj.start === "number" && typeof obj.end === "number") {
            const span = { start: obj.start, end: obj.end };
            assert.ok(span.start <= span.end, `${where}: start > end`);
            assert.ok(span.start >= parent.start && span.end <= parent.end,
                `${where} (${span.start}-${span.end}) outside of parent (${parent.start}-${parent.end})`);
            self = span;
        }
        for (const key of Object.keys(obj)) {
            visit(obj[key], self, `${where}.${key}`);
        }
    };
    const all = { start: offset, end: offset + src.length };
    visit(result.root, all, "root");
    for (const e of result.errors) {
        assert.ok(e.start >= all.start && e.end <= all.end && e.start <= e.end, "error span out of range");
    }
}

function topLevelEvents(root: DocumentNode): EventNode[] {
    const result: EventNode[] = [];
    for (const item of root.items) {
        if (item.kind === "track") {
            item.voices.forEach(v => result.push(...v.events));
        } else if (item.kind === "phraseDef") {
            result.push(...item.events);
        }
    }
    return result;
}

const files = corpusFiles();

describe("invariants", () => {
    describe("synthetic input", () => {
        const inputs = [
            "", " ", "\n", "c", "{", "}", "[", "]", "(", ")", "<", ">", "\"", "/", "/*", "--", "@", "!", "\\", ":",
            "|", "=", ";", "&", "%", "^", "~", "->", "_", "'", ",", "#", "$", "ä", "🎵",
            "\"unterminated", "/cc: \"unterminated", "<c e", "[ { (c d", "\"t\"@", "\"t\"@\"t\"@c", "c''''''''",
            "c4444", "::::", "||||", "=4", "=x=", ">\"", ">>", "using", "using \"x\"", "x:", "x =", "_a=",
            "\r\n c \t d \r\n",
        ];
        for (const src of inputs) {
            it(`${JSON.stringify(src)} (document + fragment)`, () => {
                for (const parse of [parseDocument, parseFragment]) {
                    const result = parse(src);
                    assertLossless(src, result);
                    assertSpans(src, result);
                    const shifted = parse(src, { offset: 7 });
                    assertLossless(src, shifted, 7);
                    assertSpans(src, shifted, 7);
                }
            });
        }
    });

    describe("corpus", function () {
        if (files.length === 0) {
            it("corpus not found (set WERCKMEISTER_CORPUS)");
            return;
        }

        it(`found ${files.length} corpus files`, () => {
            assert.ok(files.length > 100);
        });

        // all corpus files are valid (checked with `sheetc --mode=validate`)
        for (const file of files) {
            const name = path.basename(file);
            describe(name, () => {
                const src = fs.readFileSync(file, "utf8");

                it("parses without errors", () => {
                    const result = parseDocument(src);
                    assert.deepStrictEqual(result.errors.map(e => `${e.message} at ${e.start}: `
                        + JSON.stringify(src.substring(e.start, e.start + 30))), []);
                    assertLossless(src, result);
                    assertSpans(src, result);
                });

                it("whole file as fragment gives the same events", () => {
                    const doc: string[] = [];
                    const frag: string[] = [];
                    forEachEvent(parseDocument(src).root, e => doc.push(brief(e)));
                    forEachEvent(parseFragment(src).root, e => frag.push(brief(e)));
                    assert.deepStrictEqual(frag, doc);
                });

                it("random substrings: never throws, lossless, spans in range", () => {
                    const random = prng(src.length);
                    for (let i = 0; i < 30; i++) {
                        const a = Math.floor(random() * src.length);
                        const b = a + Math.floor(random() * Math.min(200, src.length - a + 1));
                        const sub = src.substring(a, b);
                        const result = parseFragment(sub, { offset: a });
                        assertLossless(sub, result, a);
                        assertSpans(sub, result, a);
                    }
                });

                it("substrings from event to event: fragment events == document events in that range", () => {
                    const document = parseDocument(src).root;
                    const events = topLevelEvents(document);
                    if (events.length < 2) {
                        return;
                    }
                    const random = prng(src.length + 1);
                    for (let i = 0; i < 30; i++) {
                        const x = Math.floor(random() * events.length);
                        const y = x + Math.floor(random() * Math.min(40, events.length - x));
                        const range = { start: events[x].start, end: events[y].end };
                        const expected: string[] = [];
                        forEachEvent(document, e => {
                            if (e.start >= range.start && e.end <= range.end) {
                                expected.push(brief(e));
                            }
                        });
                        const sub = src.substring(range.start, range.end);
                        const actual: string[] = [];
                        const result = parseFragment(sub, { offset: range.start });
                        forEachEvent(result.root, e => actual.push(brief(e)));
                        assert.deepStrictEqual(actual, expected, JSON.stringify(sub));
                        assert.deepStrictEqual(result.errors, [], JSON.stringify(sub));
                    }
                });
            });
        }
    });
});
