import React from "react";
import { WmMidiFileDebugger, AView, DebugMidiFile } from "../../midiDebugger";
import { Base64Binary } from "../shared/Base64Binary";
import { DebugSymbol, NavigateTo } from "./messages";

const highlightedClassName = "highlighted";

const viewTypes = {
    Piano: "Piano",
    List: "List"
};

const undefinedSourcePos = 2147483647;
const foundBySearch = 'found-by-search';

export interface MidiViewProps {
    /** "listview" or anything else for the piano roll */
    viewType: string;
    debugSymbols: DebugSymbol[] | null;
    /** the midi file, base64 encoded */
    midiData: string | null;
    onMidiFile?: (midifile: DebugMidiFile | null) => void;
    onGoToEventSource?: (debugSymbol: DebugSymbol) => void;
    onError?: (error: unknown) => void;
}

interface MidiViewState {
    viewType: string;
    searchResultMaxFound: number | string;
    searchResultIndex: number | null;
}

/** the original label of an event element, before the pitch alias was added */
type LabeledElement = HTMLElement & { _wm_original_text?: string };

/**
 * Renders the search controls, the midi view itself is rendered by WmMidiFileDebugger
 * into the elements #debugger-view and #filter of inspector.html.
 */
export class MidiViewComponent extends React.Component<MidiViewProps, MidiViewState> {
    private boundViewClickedFunction: ((ev: MouseEvent) => void) | null = null;
    private midiView: HTMLElement;
    private dbgMidi: WmMidiFileDebugger;
    private viewType: string;
    private searchTerm = "";
    private lastSearch = "";

    constructor(props: MidiViewProps) {
        super(props);
        this.state = {
            viewType: viewTypes.Piano,
            searchResultMaxFound: "",
            searchResultIndex: null
        };
        this.midiView = document.querySelector<HTMLElement>('#debugger-view')!;
        const filterElement = document.querySelector<HTMLElement>('#filter')!;
        this.dbgMidi = new WmMidiFileDebugger();
        this.dbgMidi.addFilter(filterElement);
        this.dbgMidi.addPianoRollView(this.midiView);
        this.dbgMidi.onFilterUpdated = this.onFilterUpdated.bind(this);
        this.initListener();
        this.viewType = viewTypes.Piano;
    }

    private get view(): AView {
        return this.dbgMidi.views[0];
    }

    componentDidUpdate(prevProps: MidiViewProps) {
        if (this.props.debugSymbols !== prevProps.debugSymbols) {
            this.updateDebugSymbols(this.props.debugSymbols);
            return;
        }
        if (prevProps.viewType !== this.props.viewType) {
            if (this.props.viewType === 'listview') {
                this.switchToListView();
            } else {
                this.switchToPianoRollView();
            }
            this.updateDebugSymbols(this.props.debugSymbols);
        }
        if (prevProps.midiData === this.props.midiData) {
            return;
        }
        this.updateMidiView();
        if (this.props.onMidiFile) {
            this.props.onMidiFile(this.dbgMidi.midifile);
        }
    }

    onFilterUpdated() {
        this.updateDebugSymbols();
        this.lastSearch = "";
        this.search(this.searchTerm, false);
    }

    highlight(eventElement: HTMLElement) {
        eventElement.classList.add(highlightedClassName);
    }

    clearHighlights() {
        for (const element of Array.from(document.querySelectorAll(`.${highlightedClassName}`))) {
            element.classList.remove(highlightedClassName);
        }
    }

    /** highlights the events created by the source at the given position and scrolls to the first one */
    navigateTo(navigateTo: NavigateTo) {
        this.clearHighlights();
        if (!this.props.debugSymbols) {
            return;
        }
        let firstViewElement: HTMLElement | null = null;
        this.props.debugSymbols
            .filter(x => x.documentSourceId === navigateTo.sourceId
                && navigateTo.positionOffset >= x.sourcePositionBegin
                && navigateTo.positionOffset <= x.sourcePositionEnd
                && x.sourcePositionEnd !== undefinedSourcePos)
            .forEach(debugInfo => {
                const foundViewElement = this.view.getEventElement(debugInfo.trackId, debugInfo.eventId);
                if (!foundViewElement) {
                    return;
                }
                if (!firstViewElement) {
                    firstViewElement = foundViewElement;
                }
                this.highlight(foundViewElement);
            });
        if (!firstViewElement) {
            return;
        }
        const bounds = (firstViewElement as HTMLElement).getBoundingClientRect();
        const scrollView = document.querySelector("html")!;
        scrollView.scrollTo({
            left: bounds.x + scrollView.scrollLeft - scrollView.clientWidth / 2,
            top: bounds.y + scrollView.scrollTop - scrollView.clientHeight / 2,
            behavior: "smooth"
        });
    }

    initListener() {
        this.clearListener();
        this.boundViewClickedFunction = this.onViewClicked.bind(this);
        this.view.element.addEventListener('dblclick', this.boundViewClickedFunction);
    }

    clearListener() {
        if (!this.boundViewClickedFunction) {
            return;
        }
        this.view.element.removeEventListener('dblclick', this.boundViewClickedFunction);
        this.boundViewClickedFunction = null;
    }

    /** double click on an event: go to its source */
    onViewClicked(ev: MouseEvent) {
        if (!this.props.onGoToEventSource || !this.props.debugSymbols) {
            return;
        }
        const target = ev.target as HTMLElement;
        const elementOfInterestIsOneLevelHigher = target.tagName !== 'DIV';
        const targetElement = elementOfInterestIsOneLevelHigher ? target.parentElement : target;
        if (!targetElement) {
            return;
        }
        const eventIndices = this.view.findEventIndices(targetElement);
        if (!eventIndices) {
            return;
        }
        const debugSymbolMatch = this.props.debugSymbols
            .find(x => x.trackId === eventIndices.trackIndex && x.eventId === eventIndices.eventIndex);
        if (!debugSymbolMatch) {
            return;
        }
        this.props.onGoToEventSource(debugSymbolMatch);
    }

    switchToListView() {
        this.dbgMidi.clearViews();
        this.dbgMidi.addListView(this.midiView);
        this.dbgMidi.update();
        this.initListener();
        this.viewType = viewTypes.List;
        this.setState({ viewType: this.viewType });
    }

    switchToPianoRollView() {
        this.dbgMidi.clearViews();
        this.dbgMidi.addPianoRollView(this.midiView);
        this.dbgMidi.update();
        this.initListener();
        this.viewType = viewTypes.Piano;
        this.setState({ viewType: this.viewType });
    }

    updateMidiView() {
        if (!this.props.midiData) {
            return;
        }
        const midiBuffer = Base64Binary.decodeArrayBuffer(this.props.midiData);
        try {
            this.dbgMidi.setMidiFile(midiBuffer);
            this.dbgMidi.update();
        } catch (ex) {
            console.error(ex);
            if (this.props.onError) {
                this.props.onError(ex);
            }
        }
    }

    /** shows the pitch alias (e.g. "bassdrum") in front of the event label */
    updatePitchAliases(view: AView, debugSymbols: DebugSymbol[] | null) {
        if (!debugSymbols) {
            return;
        }
        for (const info of debugSymbols.filter(x => !!x.pitchAlias)) {
            const trackId = info.trackId;
            const eventId = info.eventId;
            const eventElement = view.getEventElement(trackId, eventId) as LabeledElement | null;
            if (!eventElement) {
                continue;
            }
            const oldLabel = eventElement._wm_original_text || view.getEventLabelHtmlText(trackId, eventId) || "";
            eventElement._wm_original_text = oldLabel;
            view.updateEventLabelHtmlText(trackId, eventId, `"${info.pitchAlias}"->${oldLabel}`);
        }
    }

    updateDebugSymbols(debugSymbols?: DebugSymbol[] | null) {
        this.updatePitchAliases(this.view, debugSymbols || this.props.debugSymbols);
    }

    updateStateAsync(newState: Partial<MidiViewState>): Promise<void> {
        return new Promise(resolve => {
            this.setState(newState as MidiViewState, resolve);
        });
    }

    search(term: string, navigate = true) {
        this.lastSearch = term;
        this.dbgMidi.search(term);
        const foundElements = document.querySelectorAll<HTMLElement>(`.${foundBySearch}`);
        return this.updateStateAsync({
            searchResultMaxFound: foundElements.length,
            searchResultIndex: -1
        }).then(() => {
            const hasFoundSomething = foundElements.length > 0;
            if (!hasFoundSomething || !navigate) {
                return;
            }
            this.navigateSearchResult(foundElements, 1);
        });
    }

    onSearchKeyUp(event: React.KeyboardEvent<HTMLInputElement>) {
        this.searchTerm = event.currentTarget.value;
        if (event.key === "Enter") {
            this.search(this.searchTerm);
        }
    }

    navigateSearchResult(searchResults: NodeListOf<HTMLElement> | null, direction: number) {
        if (this.searchTerm !== this.lastSearch) {
            this.search(this.searchTerm);
            return;
        }
        const foundElements = searchResults || document.querySelectorAll<HTMLElement>(`.${foundBySearch}`);
        if (foundElements.length === 0) {
            return;
        }
        let index = this.state.searchResultIndex || 0;
        index += direction;
        if (index < 0) {
            index = foundElements.length - 1;
        }
        index = index % foundElements.length;
        this.setState({ searchResultIndex: index });
        const nextElement = foundElements[index];
        if (!nextElement) {
            return;
        }
        this.setState({
            searchResultMaxFound: foundElements.length || ""
        });
        const bounds = nextElement.getBoundingClientRect();
        const scrollView = document.querySelector("html")!;
        scrollView.scrollTo({
            top: bounds.y + scrollView.scrollTop - scrollView.clientHeight / 2,
            behavior: "smooth"
        });
    }

    gotoNextSearchResult() {
        this.navigateSearchResult(null, 1);
    }

    prevSearchResult() {
        this.navigateSearchResult(null, -1);
    }

    render() {
        return (
            <div className={this.state.viewType.toLowerCase() + ' midiview-top'}>
                <div id="view-search-ctrl">
                    <input type="text" placeholder="search" onKeyUp={this.onSearchKeyUp.bind(this)}></input>
                    <span>{
                        this.state.searchResultIndex !== null ? `${this.state.searchResultIndex + 1}/${this.state.searchResultMaxFound}` : "0/0"
                    }</span>
                    <button onClick={this.prevSearchResult.bind(this)}>▲</button>
                    <button onClick={this.gotoNextSearchResult.bind(this)}>▼</button>
                </div>
            </div>
        );
    }
}
