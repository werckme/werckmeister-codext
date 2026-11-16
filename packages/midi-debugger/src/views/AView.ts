import MIDIFile from "midifile";
import { CheckboxFilterGroup } from "../CheckboxFilterGroup";

/** a midi file with the track names (see `getTracks`) */
export type DebugMidiFile = MIDIFile & { trackNames: string[] };

export interface EventIndices {
    trackIndex: number;
    eventIndex: number;
}

/**
 * Base class of the views. Keeps the mapping from a midi event (track index, event index)
 * to the DOM element rendered for it, this is used to map the werckmeister debug symbols
 * (trackId, eventId) to the view and back.
 */
export abstract class AView {
    /**
     * [ // tracks
     *      [ // events
     *          element | null,
     *          ...
     *      ]
     * ]
     */
    eventToElementMap: (HTMLElement | null)[][] = [];
    onUpdated: (() => void) | null = null;

    constructor(public element: HTMLElement, protected trackFilter: CheckboxFilterGroup) {
    }

    clear(): void {
        this.element.innerHTML = "";
    }

    protected visitTrack(trackIndex: number): void {
        this.eventToElementMap[trackIndex] = this.eventToElementMap[trackIndex] || [];
    }

    protected visitEventElement(trackIndex: number, eventElement: HTMLElement | null | undefined): void {
        this.eventToElementMap[trackIndex].push(eventElement || null);
    }

    protected beginRender(): void {
        this.eventToElementMap = [];
    }

    protected endRender(): void {
        if (this.onUpdated) {
            this.onUpdated();
        }
    }

    /** a track is visible until the filter is initialized */
    protected isTrackVisible(trackIndex: number): boolean {
        return !!this.trackFilter.selected[trackIndex] || !this.trackFilter.initalized;
    }

    getEventLabelHtmlText(trackIndex: number, eventIndex: number): string | null {
        const element = this.getEventElement(trackIndex, eventIndex);
        if (!element) {
            return null;
        }
        return this.getEventLabelImpl(element);
    }

    updateEventLabelHtmlText(trackIndex: number, eventIndex: number, htmlText: string): void {
        const element = this.getEventElement(trackIndex, eventIndex);
        if (!element) {
            return;
        }
        this.updateEventLabelImpl(element, htmlText);
    }

    getEventElement(trackIndex: number, eventIndex: number): HTMLElement | null {
        return (this.eventToElementMap[trackIndex] || [])[eventIndex] || null;
    }

    findEventIndices(element: Element): EventIndices | null {
        for (let trackIndex = 0; trackIndex < this.eventToElementMap.length; ++trackIndex) {
            const eventElements = this.eventToElementMap[trackIndex];
            if (!eventElements) {
                continue;
            }
            const eventIndex = eventElements.indexOf(element as HTMLElement);
            if (eventIndex >= 0) {
                return { trackIndex, eventIndex };
            }
        }
        return null;
    }

    /** clears the view and renders the midi file */
    abstract update(midifile: DebugMidiFile): void;
    abstract render(midifile: DebugMidiFile): void;
    abstract search(term: string): void;
    abstract clearSearch(): void;
    protected abstract updateEventLabelImpl(element: HTMLElement, htmlText: string): void;
    protected abstract getEventLabelImpl(element: HTMLElement): string;
}
