/**
 * Minimal type declarations for the parts of `midifile` and `midievents` used by the debugger.
 */
declare module "midievents" {
    export interface MidiEvent {
        type: number;
        subtype: number;
        delta: number;
        /** set by MIDIFile.getEvents() for multi track (format 1) files */
        track?: number;
        channel?: number;
        param1?: number;
        param2?: number;
        data?: number[];
        length?: number;
        playTime?: number;
    }

    export const EVENT_META: number;
    export const EVENT_SYSEX: number;
    export const EVENT_DIVSYSEX: number;
    export const EVENT_MIDI: number;

    export const EVENT_META_SEQUENCE_NUMBER: number;
    export const EVENT_META_TEXT: number;
    export const EVENT_META_COPYRIGHT_NOTICE: number;
    export const EVENT_META_TRACK_NAME: number;
    export const EVENT_META_INSTRUMENT_NAME: number;
    export const EVENT_META_LYRICS: number;
    export const EVENT_META_MARKER: number;
    export const EVENT_META_CUE_POINT: number;
    export const EVENT_META_MIDI_CHANNEL_PREFIX: number;
    export const EVENT_META_END_OF_TRACK: number;
    export const EVENT_META_SET_TEMPO: number;
    export const EVENT_META_SMTPE_OFFSET: number;
    export const EVENT_META_TIME_SIGNATURE: number;
    export const EVENT_META_KEY_SIGNATURE: number;
    export const EVENT_META_SEQUENCER_SPECIFIC: number;

    export const EVENT_MIDI_NOTE_OFF: number;
    export const EVENT_MIDI_NOTE_ON: number;
    export const EVENT_MIDI_NOTE_AFTERTOUCH: number;
    export const EVENT_MIDI_CONTROLLER: number;
    export const EVENT_MIDI_PROGRAM_CHANGE: number;
    export const EVENT_MIDI_CHANNEL_AFTERTOUCH: number;
    export const EVENT_MIDI_PITCH_BEND: number;
}

declare module "midifile" {
    import { MidiEvent } from "midievents";

    class MIDIFileHeader {
        getFormat(): number;
        getTracksCount(): number;
        getTicksPerBeat(): number;
    }

    class MIDIFile {
        constructor(buffer?: ArrayBuffer);
        header: MIDIFileHeader;
        getEvents(type?: number, subtype?: number): MidiEvent[];
    }

    export = MIDIFile;
}
