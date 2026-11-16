import * as assert from "assert";
import * as MidiEvents from "midievents";
import { MidiEvent } from "midievents";
import MIDIFile from "midifile";
import {
    eventDataToString, eventTypeToString, getTracks, midiNumberToNoteName, midiNumberToNoteNameHtml,
} from "../midiDebugger/midiHelper";
import { fixture } from "./helpers";

function midi(subtype: number, param1?: number, param2?: number): MidiEvent {
    return { type: MidiEvents.EVENT_MIDI, subtype, delta: 0, param1, param2 };
}

function meta(subtype: number, data: number[] = [], extra: Partial<MidiEvent> = {}): MidiEvent {
    return { type: MidiEvents.EVENT_META, subtype, delta: 0, data, ...extra };
}

const bytes = (text: string) => Array.from(text).map(c => c.charCodeAt(0));

describe("midiHelper", () => {
    describe("midiNumberToNoteName", () => {
        it("uses the werckmeister octave notation", () => {
            assert.strictEqual(midiNumberToNoteName(60), "c");
            assert.strictEqual(midiNumberToNoteName(61), "c#");
            assert.strictEqual(midiNumberToNoteName(71), "b");
            assert.strictEqual(midiNumberToNoteName(72), "c'");
            assert.strictEqual(midiNumberToNoteName(48), "c,");
            assert.strictEqual(midiNumberToNoteName(0), "c,,,,,");
            assert.strictEqual(midiNumberToNoteName(127), "g'''''");
        });
    });

    describe("midiNumberToNoteNameHtml", () => {
        it("css friendly names with octave number", () => {
            assert.strictEqual(midiNumberToNoteNameHtml(60), "c-5");
            assert.strictEqual(midiNumberToNoteNameHtml(61), "c-sharp-5");
            assert.strictEqual(midiNumberToNoteNameHtml(0), "c-0");
        });
    });

    describe("eventTypeToString", () => {
        const cases: [MidiEvent, string][] = [
            [midi(MidiEvents.EVENT_MIDI_NOTE_ON, 60, 100), "note on"],
            [midi(MidiEvents.EVENT_MIDI_NOTE_OFF, 60, 0), "note off"],
            [midi(MidiEvents.EVENT_MIDI_NOTE_AFTERTOUCH, 60, 0), ""],
            [midi(MidiEvents.EVENT_MIDI_CONTROLLER, 7, 100), "cc"],
            [midi(MidiEvents.EVENT_MIDI_PROGRAM_CHANGE, 1), "pc"],
            [midi(MidiEvents.EVENT_MIDI_CHANNEL_AFTERTOUCH, 1), "after t."],
            [midi(MidiEvents.EVENT_MIDI_PITCH_BEND, 0, 64), "p. bend"],
            [midi(0x3), "0x3"],
            [meta(MidiEvents.EVENT_META_TRACK_NAME), "track"],
            [meta(MidiEvents.EVENT_META_CUE_POINT), "cue"],
            [meta(MidiEvents.EVENT_META_SET_TEMPO), "tempo"],
            [meta(MidiEvents.EVENT_META_TIME_SIGNATURE), "time sig."],
            [meta(MidiEvents.EVENT_META_COPYRIGHT_NOTICE), "©"],
            [meta(0x60), "unknown midi type"],
            [{ type: MidiEvents.EVENT_SYSEX, subtype: 0, delta: 0 }, "sysex"],
        ];
        for (const [event, expected] of cases) {
            it(`"${expected}"`, () => assert.strictEqual(eventTypeToString(event), expected));
        }
    });

    describe("eventDataToString", () => {
        it("text meta events", () => {
            assert.strictEqual(eventDataToString(meta(MidiEvents.EVENT_META_TRACK_NAME, bytes("piano"))), "piano");
            assert.strictEqual(eventDataToString(meta(MidiEvents.EVENT_META_CUE_POINT, bytes("A"))), "A");
        });
        it("notes", () => {
            assert.strictEqual(eventDataToString(midi(MidiEvents.EVENT_MIDI_NOTE_ON, 72, 100)), "c'(100)");
        });
        it("time signature", () => {
            assert.strictEqual(eventDataToString(meta(MidiEvents.EVENT_META_TIME_SIGNATURE, [], { param1: 6, param2: 3 } as Partial<MidiEvent>)), "6/8");
        });
        it("pitch bend", () => {
            assert.strictEqual(eventDataToString(midi(MidiEvents.EVENT_MIDI_PITCH_BEND, 0, 64)), (8192 / 16383).toFixed(6));
        });
        it("sysex shows the last bytes", () => {
            const sysex = (data: number[]): MidiEvent => ({ type: MidiEvents.EVENT_SYSEX, subtype: 0, delta: 0, data });
            assert.strictEqual(eventDataToString(sysex([0x41, 0x10, 0xf7])), "F0 F0 41 10 F7");
            assert.strictEqual(eventDataToString(sysex([0x41, 0x10, 0x42, 0x12, 0x40, 0xf7])), "F0 .. 10 42 12 40 F7");
        });
        it("other events: parameters", () => {
            assert.strictEqual(eventDataToString(midi(MidiEvents.EVENT_MIDI_CONTROLLER, 7, 100)), "7 100");
            assert.strictEqual(eventDataToString(midi(MidiEvents.EVENT_MIDI_PROGRAM_CHANGE, 5)), "5 ");
        });
    });

    describe("getTracks", () => {
        it("track names by index", () => {
            const midifile = new MIDIFile(fixture("368_cue_in_repeats.sheet.mid"));
            const tracks = getTracks(midifile);
            assert.ok(tracks.length > 0);
            assert.ok(tracks.every(x => typeof x === "string"));
        });
    });
});
