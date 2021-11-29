import React from "react";
import * as _ from 'lodash';
import {WmMidiFileDebugger} from '@werckmeister/midi-debugger';
import { Base64Binary } from "../shared/Base64Binary";

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
        if (prevProps.viewType !== this.props.viewType) {
            if (this.props.viewType === 'listview') {
                this.switchToListView();
            } else {
                this.switchToPianoRollView();
            }
        }
        if (prevProps.midiData === this.props.midiData) {
            return;
        }
        this.updateMidiView();
        if (this.props.onMidiFile) {
            this.props.onMidiFile(this.dbgMidi.midifile);
        }
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

    render() {
        return (
            <div>
            </div>
        );
    }
}