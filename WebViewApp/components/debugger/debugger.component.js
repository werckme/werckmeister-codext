import React from "react";
import * as _ from 'lodash';
import { TransportComponent } from "../shared/transport/transport.component";
import { BaseComponent } from "../shared/base/base.component";
import { MidiViewComponent } from "./midiview.component";

export class DebuggerComponent extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            sheetTime: 0,
            sheetfiles: {},
            mainSheet: null,
            text: "",
            playerState: "",
            duration: 0,
            dbg: "",
            midiData: null,
            sheetPath: "",
            sheetName: "",
            ppq: 0
        }
       
        window.addEventListener('message', event => { // get vscode message
            const message = event.data;
            this.handleMessage(message);
        });
    }

    componentDidMount() {
        this.sendMessageToHost("debuggerview-ready");
    }

    handleMessage(message) {      
        if (message.sheetTime !== undefined) {
            this.updateSheetTime(message.sheetTime);
        }
        if(message.playerState) {
            this.updatePlayerState(message.playerState);
        }
        if(message.duration) {
            this.updateDuration(message.duration);
        }
        if(message.compiled) {
            const compileResult = message.compiled;
            this.setState({midiData: compileResult.midi.midiData, 
                sheetPath: message.sheetPath,
                sheetName: message.sheetName});
        }
    }

    updateDuration(duration) {
        this.setState({duration: duration});
    }

    updatePlayerState(playerState) {
        this.setState({playerState: playerState.newState});
    }

    updateSheetTime(sheetTime) {
        this.setState({sheetTime: sheetTime});
    }

    onMidiFile(midifile) {
        if (midifile) {
            const ppq = midifile.header.getTicksPerBeat();
            this.setState({ppq});
        }
    }

    render() {
        return (
            <div>
                <TransportComponent 
                    sheetDuration={this.state.duration} 
                    playerState={this.state.playerState} 
                    position={this.state.sheetTime}
                    ppq={this.state.ppq}>
                </TransportComponent>
                <h2> {this.state.sheetName} </h2>
                <MidiViewComponent midiData={this.state.midiData} onMidiFile={(x) => this.onMidiFile(x)}></MidiViewComponent>
            </div>
        );
    }
}