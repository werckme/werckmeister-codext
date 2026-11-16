import * as fs from "fs";
import * as path from "path";
import { JSDOM } from "jsdom";

/**
 * jsdom does not implement `innerText`, the debugger uses it to set texts.
 * In a browser (without layout relevant content) it behaves like `textContent`.
 */
function polyfillInnerText(window: any): void {
    Object.defineProperty(window.HTMLElement.prototype, "innerText", {
        configurable: true,
        get(this: HTMLElement) { return this.textContent; },
        set(this: HTMLElement, value: unknown) { this.textContent = String(value); },
    });
}

/**
 * The new implementation uses the globals `window` and `document`.
 * They are provided by one jsdom instance for all tests.
 */
const modernDom = new JSDOM("<!doctype html><html><head></head><body></body></html>", { pretendToBeVisual: true });
polyfillInnerText(modernDom.window);
const g = global as any;
g.window = modernDom.window;
g.document = modernDom.window.document;
g.HTMLElement = modernDom.window.HTMLElement;

export const modernWindow = modernDom.window;

/** the last published version of @werckmeister/midi-debugger (webpack UMD bundle) */
const legacyBundle = fs.readFileSync(path.resolve(__dirname, "../../test/legacy/midi-debugger-1.0.0-40.js"), "utf8");

/** a fresh jsdom window with the legacy bundle loaded (`window.WmDbg`) */
export function createLegacyWindow(): any {
    const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
        runScripts: "outside-only",
        pretendToBeVisual: true,
    });
    polyfillInnerText(dom.window);
    dom.window.eval(legacyBundle);
    return dom.window;
}

/** removes everything the previous test added to the modern document */
export function resetModernDocument(): void {
    document.body.innerHTML = "";
}

/** copies the bytes into an ArrayBuffer of the given window's realm (midifile checks `instanceof ArrayBuffer`) */
export function arrayBufferFor(window: any, bytes: Uint8Array): ArrayBuffer {
    return new window.Uint8Array(bytes).buffer;
}

export const fixturesDir = path.resolve(__dirname, "../../test/fixtures");

export function fixture(name: string): Uint8Array {
    return new Uint8Array(fs.readFileSync(path.join(fixturesDir, name)));
}

export function fixtureFiles(): string[] {
    return fs.readdirSync(fixturesDir).filter(f => f.endsWith(".mid")).map(f => path.join(fixturesDir, f));
}

/**
 * Midi files rendered by the werckmeister render tests (optional, used if available).
 * Can be set with the environment variable WERCKMEISTER_MIDI_CORPUS.
 */
export function corpusFiles(): string[] {
    const dir = process.env.WERCKMEISTER_MIDI_CORPUS
        || path.resolve(__dirname, "../../../../werckmeister/rendertests");
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir).filter(f => f.endsWith(".mid")).sort().map(f => path.join(dir, f));
}

/** waits until the `setTimeout` callbacks of the filter checkboxes are executed */
export function tick(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

/** the messages the webview sent to the extension host (via acquireVsCodeApi().postMessage) */
export const sentMessages: any[] = [];
g.acquireVsCodeApi = () => ({ postMessage: (message: unknown) => sentMessages.push(message) });

export function clearSentMessages(): void {
    sentMessages.length = 0;
}
