import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import { WmMidiFileDebugger } from "../src";
import {
    arrayBufferFor, corpusFiles, createLegacyWindow, fixtureFiles, modernWindow, resetModernDocument, tick,
} from "./helpers";

/**
 * Characterization tests: the TypeScript implementation must render exactly the same
 * DOM as the last published JavaScript version (@werckmeister/midi-debugger 1.0.0-40).
 */

type ViewType = "piano" | "list";

/** the same interaction with the legacy and the new debugger, returns a snapshot after every step */
async function scenario(window: any, debuggerFactory: () => any, bytes: Uint8Array, viewType: ViewType): Promise<[string, string][]> {
    const document: Document = window.document;
    document.body.innerHTML = "";
    const filterElement = document.createElement("div");
    const viewElement = document.createElement("div");
    document.body.appendChild(filterElement);
    document.body.appendChild(viewElement);

    const snapshots: [string, string][] = [];
    const snapshot = (step: string) => snapshots.push([`${step}: filter`, filterElement.innerHTML], [`${step}: view`, viewElement.innerHTML]);

    const dbg = debuggerFactory();
    dbg.addFilter(filterElement);
    if (viewType === "piano") {
        dbg.addPianoRollView(viewElement);
    } else {
        dbg.addListView(viewElement);
    }
    dbg.setMidiFile(arrayBufferFor(window, bytes));
    dbg.update();
    snapshot("update");
    snapshots.push(["track names", JSON.stringify(dbg.midifile.trackNames)]);

    // labels (used for the pitch aliases) and event lookup
    const view = dbg.views[0];
    const lookups: unknown[] = [];
    for (let trackIndex = 0; trackIndex < view.eventToElementMap.length; ++trackIndex) {
        const events = view.eventToElementMap[trackIndex] || [];
        for (let eventIndex = 0; eventIndex < events.length; eventIndex += 3) {
            const label = view.getEventLabelHtmlText(trackIndex, eventIndex);
            if (label !== null) {
                view.updateEventLabelHtmlText(trackIndex, eventIndex, `"alias"-&gt;${label}`);
            }
            const element = view.getEventElement(trackIndex, eventIndex);
            lookups.push([trackIndex, eventIndex, label, element ? view.findEventIndices(element) : null]);
        }
    }
    snapshot("labels");
    snapshots.push(["lookups", JSON.stringify(lookups)]);

    dbg.search("note on");
    snapshot("search");
    dbg.clearSearch();
    snapshot("clear search");

    // deselect the last track via its checkbox
    let filterUpdated = 0;
    dbg.onFilterUpdated = () => ++filterUpdated;
    const checkboxes = filterElement.querySelectorAll("input");
    if (checkboxes.length > 0) {
        (checkboxes[checkboxes.length - 1] as HTMLInputElement).click();
        await tick();
        snapshot("filter changed");
        snapshots.push(["filter updated callback", String(filterUpdated)]);
    }

    // switch the view type, the filter stays
    dbg.clearViews();
    if (viewType === "piano") {
        dbg.addListView(viewElement);
    } else {
        dbg.addPianoRollView(viewElement);
    }
    dbg.update();
    snapshot("switched view");
    return snapshots;
}

async function compare(file: string, viewType: ViewType, legacyWindow: any): Promise<void> {
    const bytes = new Uint8Array(fs.readFileSync(file));
    const expected = await scenario(legacyWindow, () => new legacyWindow.WmDbg.WmMidiFileDebugger(), bytes, viewType);
    resetModernDocument();
    const actual = await scenario(modernWindow, () => new WmMidiFileDebugger(), bytes, viewType);
    assert.strictEqual(actual.length, expected.length, "number of snapshots");
    for (let i = 0; i < expected.length; ++i) {
        assert.strictEqual(actual[i][0], expected[i][0]);
        assert.strictEqual(actual[i][1], expected[i][1], `${path.basename(file)} (${viewType}) ${expected[i][0]}`);
    }
}

describe("same output as the legacy javascript implementation", function () {
    this.timeout(60000);
    let legacyWindow: any;
    const consoleWarn = console.warn;
    before(() => {
        legacyWindow = createLegacyWindow();
        // both implementations warn about overlapping notes ("corresponding midi on note not found")
        console.warn = () => { };
    });
    after(() => console.warn = consoleWarn);

    it("injects the same styles", () => {
        resetModernDocument();
        document.head.innerHTML = "";
        new WmMidiFileDebugger();
        const styleText = (doc: Document) => Array.from(doc.querySelectorAll("style")).map(x => x.textContent!.trim()).join("\n");
        const expected = styleText(legacyWindow.document);
        assert.ok(expected.length > 1000, "legacy styles are injected");
        assert.strictEqual(styleText(document), expected);
    });

    describe("fixtures", () => {
        for (const file of fixtureFiles()) {
            for (const viewType of ["piano", "list"] as ViewType[]) {
                it(`${path.basename(file)} (${viewType})`, () => compare(file, viewType, legacyWindow));
            }
        }
    });

    const corpus = corpusFiles();
    (corpus.length > 0 ? describe : describe.skip)(`werckmeister render tests corpus (${corpus.length} midi files)`, () => {
        for (const file of corpus) {
            it(`${path.basename(file)}`, async () => {
                await compare(file, "piano", legacyWindow);
                await compare(file, "list", legacyWindow);
            });
        }
    });
});
