import React from "react";
import * as _ from 'lodash';
import { WmMidiFileDebugger } from '@werckmeister/midi-debugger';
import { Base64Binary } from "../shared/Base64Binary";

const highlightedClassName = "highlighted";

const viewTypes = {
    Piano: "Piano",
    List: "List"
};

export class MidiViewComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            midiData: null
        };
        this.boundViewClickedFunction = null;
        this.midiView = document.querySelector('#debugger-view');
        const filterElement = document.querySelector('#filter');
        this.dbgMidi = new WmMidiFileDebugger();
        this.dbgMidi.addFilter(filterElement);
        this.dbgMidi.addPianoRollView(this.midiView);
        this.initListener();
        this.viewType = viewTypes.Piano;
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps) {
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

    highlight(eventElement) {
        eventElement.classList.add(highlightedClassName);
    }

    clearHighlights() {
        const elements = document.querySelectorAll(`.${highlightedClassName}`);
        for (const element of elements) {
            element.classList.remove(highlightedClassName);
        }
    }

    navigateTo(navigateTo) {
        this.clearHighlights();
        if (!this.props.debugSymbols) {
            return;
        }
        const debugInfos = this.props.debugSymbols;
        const dbgView = this.dbgMidi.views[0];
        let firstViewElement = null;
        debugInfos.filter(x => x.documentSourceId === navigateTo.sourceId
            && navigateTo.positionOffset >= x.sourcePositionBegin
            && navigateTo.positionOffset <= x.sourcePositionEnd
        ).forEach((debugInfo) => {
            const foundViewElement = dbgView.getEventElement(debugInfo.trackId, debugInfo.eventId);
            if (!foundViewElement) {
                return true; // aka continue
            }
            if (!firstViewElement) {
                firstViewElement = foundViewElement;
            }
            this.highlight(foundViewElement);
        });
        if (!firstViewElement) {
            return;
        }
        const bounds = firstViewElement.getBoundingClientRect();
        const visibleView =  document.querySelector('html');
        const visibleWidth = visibleView.clientWidth;
        const visibleHeight = visibleView.clientHeight;
        const scrollView = document.querySelector("html");
        scrollView.scrollTo({
            left: bounds.x + scrollView.scrollLeft - visibleWidth/2,
            top:  bounds.y + scrollView.scrollTop - visibleHeight/2,
            behavior: "smooth"
        });
    }
    initListener() {
        this.clearListener();
        const view = this.dbgMidi.views[0];
        const viewElement = view.element;
        this.boundViewClickedFunction = this.onViewClicked.bind(this);
        viewElement.addEventListener('dblclick', this.boundViewClickedFunction);
    }

    clearListener() {
        if (!this.boundViewClickedFunction) {
            return;
        }
        const view = this.dbgMidi.views[0];
        const viewElement = view.element;
        viewElement.removeEventListener('dblclick', this.boundViewClickedFunction);
        this.boundViewClickedFunction = null;
    }

    onViewClicked(ev) {
        if (!this.props.onGoToEventSource) {
            return;
        }
        if (!this.props.debugSymbols) {
            return;
        }
        const view = this.dbgMidi.views[0];
        const elementOfInterestIsOneLevelHigher = ev.target.tagName !== 'DIV';
        const targetElement = elementOfInterestIsOneLevelHigher ? ev.target.parentElement : ev.target;
        if (!targetElement) {
            return;
        }
        const eventIndices = view.findEventIndices(targetElement);
        if (!eventIndices) {
            return;
        }
        const debugSymbolMatch = this.props
            .debugSymbols
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
    }

    switchToPianoRollView() {
        this.dbgMidi.clearViews();
        this.dbgMidi.addPianoRollView(this.midiView);
        this.dbgMidi.update();
        this.initListener();
        this.viewType = viewTypes.Piano;
    }

    updateMidiView() {
        if (!this.props.midiData) {
            return;
        }
        const midiBuffer = Base64Binary.decodeArrayBuffer(this.props.midiData);
        this.dbgMidi.setMidiFile(midiBuffer);
        this.dbgMidi.update();
    }

    updatePitchAliases(view, debugInfoJson) {
        if (!debugInfoJson) {
            return;
        }
        const infosWithPitchAlias = debugInfoJson.filter(x => !!x.pitchAlias);
        for (const info of infosWithPitchAlias) {
            const trackId = info.trackId;
            const eventId = info.eventId;
            const eventElement = view.getEventElement(trackId, eventId);
            if (!eventElement) {
                continue;
            }
            const oldLabel = eventElement._wm_original_text || view.getEventLabelHtmlText(trackId, eventId);
            eventElement._wm_original_text = oldLabel;
            view.updateEventLabelHtmlText(trackId, eventId, `"${info.pitchAlias}"->${oldLabel}`);
        }
    };

    updateDebugSymbols(debugSymbols) {
        this.updatePitchAliases(this.dbgMidi.views[0], debugSymbols);
    }

    render() {
        return (
            <div>
            </div>
        );
    }
}