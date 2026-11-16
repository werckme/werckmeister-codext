import * as MidiEvents from "midievents";
import { MidiEvent } from "midievents";
import MIDIFile from "midifile";
import _ from "lodash";

const MaxPitchBend = 16383;

const midiTypeNames: Record<number, string> = {
    [MidiEvents.EVENT_MIDI_NOTE_OFF]: "note off",
    [MidiEvents.EVENT_MIDI_NOTE_ON]: "note on",
    [MidiEvents.EVENT_MIDI_NOTE_AFTERTOUCH]: "",
    [MidiEvents.EVENT_MIDI_CONTROLLER]: "cc",
    [MidiEvents.EVENT_MIDI_PROGRAM_CHANGE]: "pc",
    [MidiEvents.EVENT_MIDI_CHANNEL_AFTERTOUCH]: "after t.",
    [MidiEvents.EVENT_MIDI_PITCH_BEND]: "p. bend",
};

const metaTypeNames: Record<number, string> = {
    [MidiEvents.EVENT_META_SEQUENCE_NUMBER]: "seq nr.",
    [MidiEvents.EVENT_META_TEXT]: "text",
    [MidiEvents.EVENT_META_COPYRIGHT_NOTICE]: "©",
    [MidiEvents.EVENT_META_TRACK_NAME]: "track",
    [MidiEvents.EVENT_META_INSTRUMENT_NAME]: "instrument",
    [MidiEvents.EVENT_META_LYRICS]: "lyrics",
    [MidiEvents.EVENT_META_MARKER]: "marker",
    [MidiEvents.EVENT_META_CUE_POINT]: "cue",
    [MidiEvents.EVENT_META_MIDI_CHANNEL_PREFIX]: "ch. prefix",
    [MidiEvents.EVENT_META_END_OF_TRACK]: "eot",
    [MidiEvents.EVENT_META_SET_TEMPO]: "tempo",
    [MidiEvents.EVENT_META_SMTPE_OFFSET]: "smtpe off.",
    [MidiEvents.EVENT_META_TIME_SIGNATURE]: "time sig.",
    [MidiEvents.EVENT_META_KEY_SIGNATURE]: "key sig.",
    [MidiEvents.EVENT_META_SEQUENCER_SPECIFIC]: "custom",
};

/** meta events whose data is text */
const textMetaTypes = new Set([
    MidiEvents.EVENT_META_TEXT,
    MidiEvents.EVENT_META_COPYRIGHT_NOTICE,
    MidiEvents.EVENT_META_TRACK_NAME,
    MidiEvents.EVENT_META_INSTRUMENT_NAME,
    MidiEvents.EVENT_META_LYRICS,
    MidiEvents.EVENT_META_MARKER,
    MidiEvents.EVENT_META_CUE_POINT,
]);

export function isNoteOn(event: MidiEvent): boolean {
    return event.type === MidiEvents.EVENT_MIDI && event.subtype === MidiEvents.EVENT_MIDI_NOTE_ON;
}

export function isNoteOff(event: MidiEvent): boolean {
    return event.type === MidiEvents.EVENT_MIDI && event.subtype === MidiEvents.EVENT_MIDI_NOTE_OFF;
}

export function isCue(event: MidiEvent): boolean {
    return event.type === MidiEvents.EVENT_META && event.subtype === MidiEvents.EVENT_META_CUE_POINT;
}

/** the index of the track the event belongs to (format 0 files have no track info) */
export function trackIndexOf(event: MidiEvent): number {
    return event.track || 0;
}

export function eventTypeToString(event: MidiEvent): string {
    if (event.type === MidiEvents.EVENT_MIDI) {
        const name = midiTypeNames[event.subtype];
        return name !== undefined ? name : `0x${event.subtype.toString(16)}`;
    }
    if (event.type === MidiEvents.EVENT_META && metaTypeNames[event.subtype] !== undefined) {
        return metaTypeNames[event.subtype];
    }
    if (event.type === MidiEvents.EVENT_SYSEX) {
        return "sysex";
    }
    return "unknown midi type";
}

export function eventDataToString(event: MidiEvent): string {
    const data = event.data || [];
    if (event.type === MidiEvents.EVENT_META && textMetaTypes.has(event.subtype)) {
        return String.fromCharCode(...data);
    }
    if (isNoteOn(event) || isNoteOff(event)) {
        return `${midiNumberToNoteName(event.param1!)}(${event.param2})`;
    }
    if (event.type === MidiEvents.EVENT_META && event.subtype === MidiEvents.EVENT_META_TIME_SIGNATURE) {
        return `${event.param1}/${Math.round(Math.exp(event.param2! * Math.log(2)))}`;
    }
    if (event.type === MidiEvents.EVENT_MIDI && event.subtype === MidiEvents.EVENT_MIDI_PITCH_BEND) {
        return ((event.param2! << 7 | event.param1!) / MaxPitchBend).toFixed(6);
    }
    if (event.type === MidiEvents.EVENT_SYSEX) {
        const numBytesToDisplay = 5;
        const hex = ["F0", ...data.map(x => _.padStart(x.toString(16), 2, "0").toUpperCase())];
        return (numBytesToDisplay < data.length ? "F0 .. " : "F0 ") + _.takeRight(hex, numBytesToDisplay).join(" ");
    }
    const paramToString = (x: number | undefined) => x !== undefined ? x.toString() : "";
    return `${paramToString(event.param1)} ${paramToString(event.param2)}`;
}

/** e.g. 60 -> "c", 72 -> "c'", 48 -> "c," */
export function midiNumberToNoteName(midiNumber: number): string {
    const names = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];
    const octavePostfixes = [",,,,,", ",,,,", ",,,", ",,", ",", "", "'", "''", "'''", "''''", "'''''"];
    return `${names[midiNumber % 12]}${octavePostfixes[Math.floor(midiNumber / 12)]}`;
}

/** a css class friendly note name, e.g. 61 -> "c-sharp-5" */
export function midiNumberToNoteNameHtml(midiNumber: number): string {
    const names = ["c", "c-sharp", "d", "d-sharp", "e", "f", "f-sharp", "g", "g-sharp", "a", "a-sharp", "b"];
    return `${names[midiNumber % 12]}-${Math.floor(midiNumber / 12)}`;
}

/** the name of every track ("unknown" if it has no track name event) by track index */
export function getTracks(midifile: MIDIFile): string[] {
    const tracksWithName: string[] = [];
    for (const event of midifile.getEvents()) {
        const key = trackIndexOf(event);
        if (!tracksWithName[key]) {
            tracksWithName[key] = "unknown";
        }
        if (event.type === MidiEvents.EVENT_META && event.subtype === MidiEvents.EVENT_META_TRACK_NAME) {
            tracksWithName[key] = eventDataToString(event);
        }
    }
    return tracksWithName;
}
