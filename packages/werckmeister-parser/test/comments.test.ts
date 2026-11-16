import * as assert from "assert";
import { parseDocument, parseFragment } from "../src";
import { briefFragment, textOf } from "./helpers";

/**
 * Comments are removed before parsing in werckmeister (com::removeComments),
 * independent of any context. So `--` and `/*` start a comment even inside a string.
 */
describe("comments", () => {
    it("line comment", () => {
        assert.deepStrictEqual(briefFragment("c -- d e\nf"), ["note:c", "note:f"]);
    });

    it("line comment without whitespace", () => {
        assert.deepStrictEqual(briefFragment("c--d\nf"), ["note:c", "note:f"]);
    });

    it("block comment", () => {
        assert.deepStrictEqual(briefFragment("c /* d \n e */ f"), ["note:c", "note:f"]);
    });

    it("block comment inside an event (acts like whitespace)", () => {
        assert.deepStrictEqual(briefFragment("c/**/'4"), ["note:c'4"]);
    });

    it("block comment is not a meta event", () => {
        assert.deepStrictEqual(briefFragment("/* x */ /cc: 1 2/"), ["meta:/cc: 1 2/"]);
    });

    it("line comment inside a block comment", () => {
        assert.deepStrictEqual(briefFragment("c /* -- */ d"), ["note:c", "note:d"]);
    });

    it("unterminated block comment runs to the end", () => {
        const result = parseFragment("c /* d e");
        assert.deepStrictEqual(briefFragment("c /* d e"), ["note:c"]);
        assert.deepStrictEqual(result.errors, []);
    });

    it("comment tokens", () => {
        const src = "c -- x\n/* y */ d";
        const comments = parseFragment(src).tokens.filter(t => t.kind === "comment");
        assert.deepStrictEqual(comments.map(t => textOf(src, t)), ["-- x", "/* y */"]);
    });

    it("`--` inside a string starts a comment as well (same as the compiler)", () => {
        const result = parseDocument("using \"a--b.lua\";");
        assert.ok(result.errors.length > 0);
    });

    it("`->` is not a comment", () => {
        assert.deepStrictEqual(briefFragment("c-> d"), ["note:c->", "note:d"]);
    });
});
