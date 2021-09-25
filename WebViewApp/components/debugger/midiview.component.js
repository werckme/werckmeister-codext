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
        console.log(this.midiView)
        this.dbgMidi = new WmMidiFileDebugger();
        this.dbgMidi.addListView(this.midiView);
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps) {
        if (prevProps.midiData === this.props.midiData) {
            return;
        }
        this.updateMidiView();
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