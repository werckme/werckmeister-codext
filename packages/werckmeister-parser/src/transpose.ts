import { Pitch, Span } from "./ast";
import { parseDocument, parseFragment } from "./parser";
import { eventsInRange } from "./walk";

/** octave marks range from `,,,,,` (-5) to `'''''` (+5) */
export const MIN_OCTAVE = -5;
export const MAX_OCTAVE = 5;

export interface TextEdit extends Span {
    newText: string;
}

export interface TransposeOptions {
    /** only pitches overlapping this range; default: the whole text */
    range?: Span;
    /**
     * true: `text` is a fragment (e.g. only the selected text) instead of a whole document.
     * Prefer passing the whole document plus `range`, it is more reliable.
     */
    fragment?: boolean;
}

export interface TransposeResult {
    edits: TextEdit[];
    /** pitches which were not transposed because the octave limit is reached */
    skipped: Pitch[];
}

/**
 * Transposes all notes and degrees one octave up (+1) or down (-1).
 * Aliases ("bd") and extended pitches (x) have no octave and are left untouched.
 * Pitches at the octave limit are skipped.
 * Returns the edits only; use `applyEdits` to get the new text.
 */
export function transposeOctave(text: string, direction: 1 | -1, options: TransposeOptions = {}): TransposeResult {
    const range = options.range || { start: 0, end: text.length };
    const root = options.fragment ? parseFragment(text).root : parseDocument(text).root;
    const edits: TextEdit[] = [];
    const skipped: Pitch[] = [];
    for (const event of eventsInRange(root, range)) {
        if (event.kind !== "note" && event.kind !== "degree") {
            continue;
        }
        for (const pitch of event.pitches) {
            if (pitch.kind === "alias" || pitch.kind === "extendedPitch" || !overlaps(pitch, range)) {
                continue;
            }
            const octave = pitch.octave + direction;
            if (octave > MAX_OCTAVE || octave < MIN_OCTAVE) {
                skipped.push(pitch);
                continue;
            }
            edits.push({ ...pitch.octaveSpan, newText: octaveMarks(octave) });
        }
    }
    return { edits, skipped };
}

export function octaveMarks(octave: number): string {
    return octave > 0 ? "'".repeat(octave) : ",".repeat(-octave);
}

/** applies non overlapping edits */
export function applyEdits(text: string, edits: TextEdit[]): string {
    const sorted = [...edits].sort((a, b) => b.start - a.start);
    for (const e of sorted) {
        text = text.substring(0, e.start) + e.newText + text.substring(e.end);
    }
    return text;
}

function overlaps(a: Span, range: Span): boolean {
    if (range.start === range.end) {
        return a.start <= range.start && range.start <= a.end;
    }
    return a.start < range.end && range.start < a.end;
}
