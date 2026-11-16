import _ from "lodash";
import { MidiEvent } from "midievents";
import { eventDataToString, eventTypeToString, trackIndexOf } from "../midiHelper";
import { AView, DebugMidiFile } from "./AView";

/** the cell containing the event data, its text is replaced by pitch aliases */
const eventTextChildIndex = 4;
const foundBySearch = "found-by-search";

/**
 * Shows all events as a table: track, time, channel, type and data.
 */
export class ListView extends AView {
    ppq = 0;
    eventList: HTMLTableElement | null = null;
    quarters = 0;

    clearSearch(): void {
        for (const row of Array.from(document.querySelectorAll(`.${foundBySearch}`))) {
            row.classList.remove(foundBySearch);
        }
    }

    search(term: string): void {
        this.clearSearch();
        term = (term || "").trim();
        if (!term) {
            return;
        }
        const rows = Array.from(document.querySelectorAll<HTMLElement>(".wm-dbg-listview tbody tr"))
            .filter(x => x.innerText.includes(term));
        for (const row of rows) {
            row.classList.add(foundBySearch);
        }
    }

    update(midifile: DebugMidiFile): void {
        this.clear();
        this.ppq = midifile.header.getTicksPerBeat();
        this.render(midifile);
    }

    private addCell(row: HTMLElement, value: string | number): void {
        const td = document.createElement("td");
        td.innerText = String(value);
        row.appendChild(td);
    }

    private renderEvent(row: HTMLElement, event: MidiEvent): void {
        const type = eventTypeToString(event);
        const trackIndex = trackIndexOf(event);
        row.classList.add(`wm-dbg-track-${trackIndex}`);
        const typeClass = _.kebabCase(type);
        if (typeClass) {
            row.classList.add(typeClass);
        }
        this.addCell(row, trackIndex);
        this.addCell(row, this.quarters.toFixed(6));
        this.addCell(row, event.channel !== undefined ? event.channel : "-");
        this.addCell(row, type);
        this.addCell(row, eventDataToString(event));
    }

    protected updateEventLabelImpl(element: HTMLElement, htmlText: string): void {
        (element.childNodes[eventTextChildIndex] as HTMLElement).innerHTML = htmlText;
    }

    protected getEventLabelImpl(element: HTMLElement): string {
        return (element.childNodes[eventTextChildIndex] as HTMLElement).innerHTML;
    }

    render(midifile: DebugMidiFile): void {
        this.beginRender();
        this.quarters = 0;
        if (!this.eventList) {
            this.eventList = document.createElement("table");
        } else {
            this.eventList.innerHTML = "";
        }
        this.eventList.className = "wm-dbg-listview";
        const header = document.createElement("thead");
        this.eventList.appendChild(header);
        const headerRow = document.createElement("tr");
        header.appendChild(headerRow);
        for (const title of ["Track", "Time (qtrs)", "Channel", "Type", "Data"]) {
            this.addCell(headerRow, title);
        }
        const tbody = document.createElement("tbody");
        this.eventList.appendChild(tbody);
        for (const event of midifile.getEvents()) {
            const trackIndex = trackIndexOf(event);
            this.visitTrack(trackIndex);
            this.quarters += event.delta / this.ppq;
            if (!this.isTrackVisible(trackIndex)) {
                continue;
            }
            const row = document.createElement("tr");
            tbody.appendChild(row);
            this.renderEvent(row, event);
            this.visitEventElement(trackIndex, row);
        }
        this.element.appendChild(this.eventList);
        this.endRender();
    }
}
