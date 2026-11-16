// helpers first: they provide window/document for react-dom
import { clearSentMessages, fixture, modernWindow, sentMessages, tick } from "./helpers";
import * as assert from "assert";
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { PianoView } from "../components/pianoView/pianoView";
import { TransportComponent, TransportProps } from "../components/shared/transport/transport.component";
import { TransportViewComponent } from "../components/transportView/transportView.component";
import { DebuggerComponent } from "../components/debugger/debugger.component";
import { PlayerState } from "../components/shared/com/playerStates";
import { AView } from "../midiDebugger";

// not implemented by jsdom
(modernWindow.HTMLElement.prototype as any).scrollTo = () => { };

const mountedContainers: HTMLElement[] = [];

function mount<T>(element: React.ReactElement, parent: HTMLElement = document.body): { container: HTMLElement; instance: T } {
    const container = document.createElement("div");
    parent.appendChild(container);
    mountedContainers.push(container);
    let instance: any;
    act(() => {
        instance = ReactDOM.render(element, container);
    });
    return { container, instance };
}

function query<T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T {
    const element = root.querySelector<T>(selector);
    assert.ok(element, `element "${selector}" not found`);
    return element!;
}

function click(element: Element): void {
    act(() => {
        (element as HTMLElement).click();
    });
}

/** sets the value of a controlled input (react listens to the native value setter + input/change events) */
function changeValue(element: HTMLInputElement | HTMLSelectElement, value: string): void {
    const prototype = element instanceof modernWindow.HTMLSelectElement ? modernWindow.HTMLSelectElement.prototype : modernWindow.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    act(() => {
        element.dispatchEvent(new modernWindow.Event("input", { bubbles: true }));
        element.dispatchEvent(new modernWindow.Event("change", { bubbles: true }));
    });
}

function lastMessage(): any {
    return sentMessages[sentMessages.length - 1];
}

beforeEach(() => {
    act(() => {
        for (const container of mountedContainers.splice(0)) {
            ReactDOM.unmountComponentAtNode(container);
        }
    });
    document.body.innerHTML = "";
    clearSentMessages();
});

describe("PianoView", () => {
    const key = (octave: number, key: string) => query(`.octave-${octave} .key.${key} > button`);
    const radio = (value: string) => query<HTMLInputElement>(`input[type=radio][value="${value}"]`);

    it("tells the host it is ready", () => {
        mount(<PianoView />);
        assert.deepStrictEqual(sentMessages, [{ command: "pianoview-ready" }]);
    });

    it("writes the clicked note with its octave", () => {
        mount(<PianoView />);
        click(key(0, "c"));
        assert.deepStrictEqual(lastMessage(), { command: "send-text", text: "c " });
        click(key(1, "d"));
        assert.strictEqual(lastMessage().text, "d' ");
        click(key(-2, "e"));
        assert.strictEqual(lastMessage().text, "e,, ");
    });

    it("black keys: sharp or flat", () => {
        mount(<PianoView />);
        click(key(0, "cs"));
        assert.strictEqual(lastMessage().text, "c# ");
        click(radio("♭"));
        click(key(0, "cs"));
        assert.strictEqual(lastMessage().text, "db ");
        click(key(0, "gs"));
        assert.strictEqual(lastMessage().text, "ab ");
        click(key(0, "as"));
        assert.strictEqual(lastMessage().text, "bb ");
    });

    it("duration and dots are used once", () => {
        mount(<PianoView />);
        click(radio("8"));
        click(radio("."));
        click(key(0, "c"));
        assert.strictEqual(lastMessage().text, "c8. ");
        click(key(0, "c"));
        assert.strictEqual(lastMessage().text, "c ");
    });

    it("bar lines and chords", () => {
        mount(<PianoView />);
        const buttons = Array.from(document.querySelectorAll(".control.bar button"));
        const texts = buttons.map(button => {
            click(button);
            return lastMessage().text;
        });
        assert.deepStrictEqual(texts, ["| ", "|: ", ":| ", ":| ", "<> "]);
        click(radio("4"));
        click(buttons[4]);
        assert.strictEqual(lastMessage().text, "<>4 ");
    });
});

describe("TransportComponent", () => {
    const props: TransportProps = { playerState: PlayerState.Stopped, position: 2.5, sheetDuration: 960, ppq: 480 };

    it("shows position and end time", () => {
        mount(<TransportComponent {...props} />);
        assert.strictEqual(query(".display span").textContent, "002.50");
        assert.strictEqual(query<HTMLInputElement>(".range-to").value, "2");
        assert.strictEqual(query(".transport-state").textContent, "Stopped");
    });

    it("play and stop", () => {
        mount(<TransportComponent {...props} />);
        click(query(".btn-play"));
        assert.deepStrictEqual(lastMessage(), { command: "player-play", begin: 0 });
        click(query(".btn-stop"));
        assert.deepStrictEqual(lastMessage(), { command: "player-stop" });
    });

    it("pause while playing, begin can not be changed", () => {
        mount(<TransportComponent {...props} playerState={PlayerState.Playing} />);
        assert.strictEqual(document.querySelector(".btn-play"), null);
        click(query(".btn-paused"));
        assert.deepStrictEqual(lastMessage(), { command: "player-pause" });
        assert.strictEqual(query<HTMLInputElement>(".range-from").disabled, true);
    });

    it("buttons are disabled while the player changes its state", () => {
        mount(<TransportComponent {...props} playerState={PlayerState.StartPlaying} />);
        assert.strictEqual(query<HTMLButtonElement>(".btn-play").disabled, true);
        assert.strictEqual(query<HTMLButtonElement>(".btn-stop").disabled, true);
    });

    it("connected to the vst plugin: no player controls", () => {
        mount(<TransportComponent {...props} playerState={PlayerState.ConnectedToVst} />);
        query("#vsticon");
        assert.strictEqual(document.querySelector(".btn-play"), null);
        assert.strictEqual(query(".transport-state").style.visibility, "hidden");
    });

    it("changing the begin time updates the range (debounced)", async () => {
        mount(<TransportComponent {...props} />);
        changeValue(query<HTMLInputElement>(".range-from"), "4");
        assert.strictEqual(sentMessages.length, 0);
        await new Promise(resolve => setTimeout(resolve, 150));
        assert.deepStrictEqual(lastMessage(), { command: "player-update-range", begin: "4" });
        click(query(".btn-play"));
        assert.deepStrictEqual(lastMessage(), { command: "player-play", begin: "4" });
    });

    it("follow switch", () => {
        const changes: boolean[] = [];
        mount(<TransportComponent {...props} followTransport={true} followTransportChange={v => changes.push(v)} />);
        assert.ok(query(".switch-component").classList.contains("isOn"));
        click(query(".switch-component"));
        assert.deepStrictEqual(changes, [false]);
    });
});

describe("TransportViewComponent", () => {
    it("ready message and updates from the host", async () => {
        mount(<TransportViewComponent />);
        assert.deepStrictEqual(sentMessages, [{ command: "transportview-ready" }]);
        await act(async () => {
            window.postMessage({ sheetTime: 1.5, playerState: { newState: PlayerState.Playing }, duration: 960 }, "*");
            await tick();
        });
        assert.strictEqual(query(".display span").textContent, "001.50");
        query(".btn-paused");
    });
});

describe("DebuggerComponent", () => {
    const sourcePath = "/sheets/a.sheet";
    const midiData = Buffer.from(fixture("368_cue_in_repeats.sheet.mid")).toString("base64");

    /** the elements of inspector.html */
    function mountDebugger(): DebuggerComponent {
        for (const id of ["debugger-main-component", "filter", "debugger-view"]) {
            const div = document.createElement("div");
            div.id = id;
            document.body.appendChild(div);
        }
        return mount<DebuggerComponent>(<DebuggerComponent />, query("#debugger-main-component")).instance;
    }

    function send(dbg: DebuggerComponent, message: object): void {
        act(() => dbg.handleMessage(message));
    }

    function compiled(dbg: DebuggerComponent, data = midiData): void {
        send(dbg, {
            compiled: { midi: { midiData: data, duration: 1920, sources: [{ sourceId: 1, path: sourcePath }] } },
            sheetPath: sourcePath,
            sheetName: "a.sheet",
        });
    }

    function view(dbg: DebuggerComponent): AView {
        return (dbg.midiViewComponent as any).dbgMidi.views[0];
    }

    /** track and event index of the first rendered note */
    function firstNote(dbg: DebuggerComponent): { trackId: number; eventId: number; element: HTMLElement } {
        const map = view(dbg).eventToElementMap;
        for (let trackId = 0; trackId < map.length; ++trackId) {
            const eventId = (map[trackId] || []).findIndex(x => !!x && !x.classList.contains("event-cue"));
            if (eventId >= 0) {
                return { trackId, eventId, element: map[trackId][eventId]! };
            }
        }
        throw new Error("no note rendered");
    }

    it("shows a message until midi data is available", () => {
        mountDebugger();
        assert.deepStrictEqual(sentMessages, [{ command: "debuggerview-ready" }]);
        query(".error-message");
    });

    it("renders the compiled midi file as piano roll with track filter", () => {
        const dbg = mountDebugger();
        compiled(dbg);
        assert.strictEqual(query("h2").textContent, " a.sheet ");
        assert.strictEqual(document.querySelector(".error-message"), null);
        assert.ok(document.querySelectorAll("#debugger-view .piano-roll .event").length > 0);
        assert.ok(document.querySelectorAll("#filter input[type=checkbox]").length > 0);
        assert.strictEqual(dbg.state.ppq, 5000); // ticks per quarter of the fixture
        assert.strictEqual(dbg.state.duration, 1920);
    });

    it("invalid midi data shows the message", () => {
        const dbg = mountDebugger();
        const consoleError = console.error;
        console.error = () => { };
        try {
            compiled(dbg, Buffer.from("no midi file, but long enough to be parsed").toString("base64"));
        } finally {
            console.error = consoleError;
        }
        query(".error-message");
    });

    it("pitch aliases, go to source and navigate to source", () => {
        const dbg = mountDebugger();
        compiled(dbg);
        const { trackId, eventId, element } = firstNote(dbg);
        const label = element.querySelector("span")!.textContent;
        const symbol = { trackId, eventId, documentSourceId: 1, sourcePositionBegin: 10, sourcePositionEnd: 12, pitchAlias: "bd" };
        send(dbg, { debugSymbols: [symbol] });
        assert.strictEqual(element.querySelector("span")!.textContent, `"bd"->${label}`);

        act(() => {
            element.querySelector("span")!.dispatchEvent(new modernWindow.MouseEvent("dblclick", { bubbles: true }));
        });
        assert.deepStrictEqual(lastMessage(), { command: "goToEventSource", eventInfo: { ...symbol, documentPath: sourcePath } });

        send(dbg, { navigateTo: { documentPath: sourcePath, positionOffset: 11 } });
        assert.ok(element.classList.contains("highlighted"));
        send(dbg, { navigateTo: { documentPath: sourcePath, positionOffset: 20 } });
        assert.ok(!element.classList.contains("highlighted"));
    });

    it("list view and search", () => {
        const dbg = mountDebugger();
        compiled(dbg);
        changeValue(query<HTMLSelectElement>("#view-switch-ctrl"), "listview");
        assert.ok(document.querySelectorAll("#debugger-view .wm-dbg-listview tbody tr").length > 0);
        assert.strictEqual(document.querySelector("#debugger-view .piano-roll"), null);

        const input = query<HTMLInputElement>("#view-search-ctrl input");
        input.value = "note on";
        act(() => {
            input.dispatchEvent(new modernWindow.KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
        });
        const found = document.querySelectorAll(".found-by-search").length;
        assert.ok(found > 0);
        return tick().then(() => {
            assert.strictEqual(query("#view-search-ctrl span").textContent, `1/${found}`);
            click(query("#view-search-ctrl button:last-child"));
            assert.strictEqual(query("#view-search-ctrl span").textContent, `2/${found}`);
            click(query("#view-search-ctrl button:first-of-type"));
            assert.strictEqual(query("#view-search-ctrl span").textContent, `1/${found}`);
        });
    });
});
