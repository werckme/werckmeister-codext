import React from "react";
import * as _ from 'lodash';
import { WmMidiFileDebugger } from '@werckmeister/midi-debugger';
import { Base64Binary } from "../shared/Base64Binary";

const highlightedClassName = "highlighted";

export class MidiViewComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            midiData: null
        };
        this.midiView = document.querySelector('#debugger-view');
        const filterElement = document.querySelector('#filter');
        this.dbgMidi = new WmMidiFileDebugger();
        this.dbgMidi.addFilter(filterElement);
        this.dbgMidi.addPianoRollView(this.midiView);
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
        //document.querySelector("html").scrollTo(0, 0);
        const bounds = firstViewElement.getBoundingClientRect();
        const scrollView = document.querySelector("html");
        scrollView.scrollTo({
            left:bounds.x + scrollView.scrollLeft, 
            top:bounds.y + scrollView.scrollTop, 
            behavior: "smooth"
        });
    }

    switchToListView() {
        this.dbgMidi.clearViews();
        this.dbgMidi.addListView(this.midiView);
        this.dbgMidi.update();
    }

    switchToPianoRollView() {
        this.dbgMidi.clearViews();
        this.dbgMidi.addPianoRollView(this.midiView);
        this.dbgMidi.update();
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
        const infosWithPitchAlias = debugInfoJson.filter(x => !!x.pitchAlias);
        for (const info of infosWithPitchAlias) {
            const trackId = info.trackId;
            const eventId = info.eventId;
            const oldLabel = view.getEventLabelHtmlText(trackId, eventId);
            view.updateEventLabelHtmlText(trackId, eventId, `"${info.pitchAlias}" ${oldLabel}`);
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