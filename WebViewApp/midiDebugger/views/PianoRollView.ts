import _ from "lodash";
import { MidiEvent } from "midievents";
import { eventDataToString, isCue, isNoteOff, isNoteOn, midiNumberToNoteNameHtml, trackIndexOf } from "../midiHelper";
import { AView, DebugMidiFile } from "./AView";

/** the span containing the event text, its text is replaced by pitch aliases */
const eventTextChildIndex = 0;

/** cue events are rendered into the pitch group with this index */
const cuePitchIndex = 0;

/** a midi event with its position in quarters, note ons get the duration when the note off is found */
type PositionedEvent = MidiEvent & { absPosition: number; duration?: number };

interface PitchGroup {
    elements: PositionedEvent[];
    container: HTMLElement;
}

interface Track {
    container: HTMLElement;
    pitches: PitchGroup[];
}

/**
 * Shows the notes of every track as a piano roll, one row per pitch.
 */
export class PianoRollView extends AView {
    ppq = 0;
    eventList: HTMLElement | null = null;
    cueContainer: HTMLElement | null = null;
    /** pixels per quarter */
    xscale = 100;
    maxWidth = 0;
    quarters = 0;

    update(midifile: DebugMidiFile): void {
        this.clear();
        this.ppq = midifile.header.getTicksPerBeat();
        this.render(midifile);
    }

    /** not supported by the piano roll */
    search(_term: string): void {
    }

    clearSearch(): void {
    }

    private eventPosAndDuration(noteOn: PositionedEvent, noteOff: PositionedEvent): string {
        return ` ${noteOn.absPosition.toFixed(3)} - ${noteOff.absPosition.toFixed(3)}`;
    }

    protected updateEventLabelImpl(element: HTMLElement, htmlText: string): void {
        const labelElement = element.childNodes[eventTextChildIndex] as HTMLElement;
        labelElement.innerHTML = htmlText;
        labelElement.title = labelElement.textContent || "";
    }

    protected getEventLabelImpl(element: HTMLElement): string {
        return (element.childNodes[eventTextChildIndex] as HTMLElement).innerHTML;
    }

    private createEventElement(classes: string[], left: number, width: number, text: string): HTMLElement {
        const eventElement = document.createElement("div");
        eventElement.classList.add("event", ...classes);
        eventElement.style.width = `${width * this.xscale}px`;
        eventElement.style.left = `${left * this.xscale}px`;
        const textElement = document.createElement("span");
        eventElement.title = text;
        textElement.textContent = text;
        eventElement.appendChild(textElement);
        return eventElement;
    }

    private renderCue(track: Track, event: PositionedEvent): HTMLElement {
        const pitches = track.pitches[cuePitchIndex];
        pitches.elements.push(event);
        const eventElement = this.createEventElement(["velocity-127", "event-cue"], event.absPosition, 1, `⚑ ${eventDataToString(event)}`);
        pitches.container.appendChild(eventElement);
        return eventElement;
    }

    /** returns the element for a cue or a note off (the note element), nothing for other events */
    private renderEvent(track: Track, event: PositionedEvent): HTMLElement | undefined {
        if (isCue(event)) {
            return this.renderCue(track, event);
        }
        const noteOn = isNoteOn(event);
        if (!noteOn && !isNoteOff(event)) {
            return;
        }
        const pitches = track.pitches[event.param1!];
        if (noteOn) {
            pitches.elements.push(event);
            return;
        }
        const noteOnEvent = _.last(pitches.elements);
        if (!noteOnEvent) {
            return;
        }
        if (noteOnEvent.duration !== undefined) {
            console.warn("corresponding midi on note not found");
            return;
        }
        noteOnEvent.duration = event.absPosition - noteOnEvent.absPosition;
        const eventText = `${eventDataToString(noteOnEvent)}${this.eventPosAndDuration(noteOnEvent, event)}`;
        const eventElement = this.createEventElement([`velocity-${noteOnEvent.param2}`], noteOnEvent.absPosition, noteOnEvent.duration, eventText);
        pitches.container.appendChild(eventElement);
        return eventElement;
    }

    private createPitchGroups(track: Track): void {
        const createPitchElement = (pitch: number) => {
            const pitchContainer = document.createElement("div");
            pitchContainer.classList.add("pitch-group", midiNumberToNoteNameHtml(pitch));
            track.pitches[pitch] = { elements: [], container: pitchContainer };
            track.container.appendChild(pitchContainer);
        };
        for (let pitch = 127; pitch >= 0; --pitch) {
            createPitchElement(pitch);
        }
        // an extra row for the cues (replaces the pitch group of pitch 0)
        createPitchElement(cuePitchIndex);
    }

    private postProcess(tracks: Record<number, Track>): void {
        const ends = _.values(tracks)
            .flatMap(track => track.pitches)
            .map(pitchGroup => _.last(pitchGroup.elements))
            .filter((event): event is PositionedEvent => !!event)
            .map(event => event.absPosition + event.duration!);
        this.maxWidth = this.xscale * (_.max(ends) as number);
        for (const track of _.values(tracks)) {
            const pitchGroupElements = track.pitches
                .filter(x => x.elements.length > 0)
                .map(x => x.container);
            for (const pitchGroupElement of pitchGroupElements) {
                pitchGroupElement.classList.add("pitch-group-hasvalue");
                pitchGroupElement.style.width = `${this.maxWidth}px`;
            }
            if (pitchGroupElements.length === 0) {
                track.container.classList.add("track-empty");
            }
            track.container.style.width = `${this.maxWidth}px`;
        }
    }

    /** vertical lines with labels for every quarter */
    private renderGrid(container: HTMLElement): void {
        const height = container.clientHeight;
        const canvas = document.createElement("div");
        canvas.style.position = "absolute";
        canvas.style.top = "0px";
        canvas.classList.add("grid-style");
        container.appendChild(canvas);
        container.style.width = `${this.maxWidth}px`;
        let x = 0;
        let quarters = 0;
        while (x < this.maxWidth) {
            quarters += 1;
            x = quarters * this.xscale;
            const gridDiv = document.createElement("div");
            const gridLabel = document.createElement("div");
            gridLabel.innerHTML = `${quarters.toFixed(0)}`;
            gridDiv.appendChild(gridLabel);
            gridLabel.style.position = "absolute";
            gridDiv.classList.add("grid-element");
            gridDiv.style.position = "absolute";
            gridDiv.style.left = `${x}px`;
            gridDiv.style.width = "2px";
            gridDiv.style.top = "0px";
            gridDiv.style.height = `${height + 25}px`;
            canvas.appendChild(gridDiv);
        }
    }

    render(midifile: DebugMidiFile): void {
        this.beginRender();
        const tracks: Record<number, Track> = {};
        this.quarters = 1;
        if (!this.eventList || !this.cueContainer) {
            this.eventList = document.createElement("div");
            this.eventList.classList.add("piano-roll");
            this.cueContainer = document.createElement("div");
            this.cueContainer.classList.add("cues");
            this.eventList.appendChild(this.cueContainer);
        } else {
            this.eventList.innerHTML = "";
            this.cueContainer.innerHTML = "";
        }
        for (const midiEvent of midifile.getEvents()) {
            this.quarters += midiEvent.delta / this.ppq;
            const event = midiEvent as PositionedEvent;
            event.absPosition = this.quarters;
            const trackIndex = trackIndexOf(event);
            this.visitTrack(trackIndex);
            if (!this.isTrackVisible(trackIndex)) {
                continue;
            }
            let track = tracks[trackIndex];
            if (!track) {
                track = { container: document.createElement("div"), pitches: [] };
                const title = document.createElement("span");
                title.classList.add("track-title");
                title.textContent = midifile.trackNames[trackIndex];
                track.container.appendChild(title);
                this.createPitchGroups(track);
                track.container.classList.add("track", `track-${trackIndex}`);
                tracks[trackIndex] = track;
                this.eventList.appendChild(track.container);
            }
            this.visitEventElement(trackIndex, this.renderEvent(track, event));
        }
        this.postProcess(tracks);
        this.element.appendChild(this.eventList);
        this.renderGrid(this.eventList);
        this.endRender();
    }
}
