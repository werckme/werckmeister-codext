import _ from "lodash";
import MIDIFile from "midifile";
import { CheckboxFilterGroup, CheckboxItem } from "./CheckboxFilterGroup";
import { getTracks } from "./midiHelper";
import { injectStyles } from "./styles";
import { AView, DebugMidiFile } from "./views/AView";
import { ListView } from "./views/ListView";
import { PianoRollView } from "./views/PianoRollView";

declare global {
    interface Window {
        /** the last created debugger, for debugging in the dev tools */
        wmDbg?: WmMidiFileDebugger;
    }
}

/**
 * Shows the events of a midi file in a piano roll or a list view,
 * with a track filter (checkbox per track) and a search (list view only).
 */
export class WmMidiFileDebugger {
    trackFilter = new CheckboxFilterGroup();
    trackFilterElement: HTMLElement | null = null;
    filterItems: CheckboxItem[] | null = null;
    filterParent: HTMLElement | null = null;
    onFilterUpdated: () => void = () => { };
    midifile: DebugMidiFile | null = null;
    views: AView[] = [];

    constructor() {
        injectStyles(document);
        window.wmDbg = this;
    }

    setMidiFile(arrayBuffer: ArrayBuffer): void {
        const midifile = new MIDIFile(arrayBuffer) as DebugMidiFile;
        midifile.trackNames = getTracks(midifile);
        this.midifile = midifile;
    }

    addListView(element: HTMLElement): void {
        this.views.push(new ListView(element, this.trackFilter));
    }

    addPianoRollView(element: HTMLElement): void {
        this.views.push(new PianoRollView(element, this.trackFilter));
    }

    clearViews(): void {
        for (const view of this.views) {
            view.clear();
        }
        this.views = [];
    }

    addFilter(element: HTMLElement): void {
        this.filterParent = element;
    }

    update(): void {
        const midifile = this.requireMidiFile();
        for (const view of this.views) {
            view.update(midifile);
        }
        this.updateFilter();
    }

    renderViews(): void {
        const midifile = this.requireMidiFile();
        for (const view of this.views) {
            view.render(midifile);
        }
    }

    /** (re)creates the track checkboxes, the selection is kept as long as the tracks are the same */
    updateFilter(): void {
        if (!this.filterParent) {
            return;
        }
        const element = this.filterParent;
        element.innerHTML = "";
        const filterItems: CheckboxItem[] = this.requireMidiFile().trackNames
            .map((name, idx) => ({ name: `${name}(${idx})`, value: idx, class_: `wm-dbg-track-${idx}` }));
        if (!this.trackFilterElement || !_.isEqual(filterItems, this.filterItems)) {
            this.filterItems = filterItems;
            this.trackFilterElement = this.trackFilter.createElement(this.filterItems);
        }
        this.trackFilter.onSelectionChanged = () => {
            this.renderViews();
            this.onFilterUpdated();
        };
        element.appendChild(this.trackFilterElement);
    }

    search(term: string): void {
        for (const view of this.views) {
            view.search(term);
        }
    }

    clearSearch(): void {
        for (const view of this.views) {
            view.clearSearch();
        }
    }

    private requireMidiFile(): DebugMidiFile {
        if (!this.midifile) {
            throw new Error("no midi file set, call setMidiFile() first");
        }
        return this.midifile;
    }
}
