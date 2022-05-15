import React from "react";
import * as _ from 'lodash';
import { TransportComponent } from "../shared/transport/transport.component";
import { BaseComponent } from "../shared/base/base.component";
import { MidiViewComponent } from "./midiview.component";

const MsgMissingMidiData = <div>
    No MIDI data available. You have two options to fix this: 
    <ol>
        <li>
            Trigger a view update by saving a ".sheet" file.
        </li>
        <li>
            Start the playback of a ".sheet" file
        </li>
    </ol>
</div>;

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
            ppq: 0,
            selectedView: "",
            isFollow: false,
            debugSymbols: null
        }
        this.compileResult = null;
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
            this.compileResult = message.compiled;
            this.setState({midiData: this.compileResult.midi.midiData, 
                sheetPath: message.sheetPath,
                sheetName: message.sheetName});
        }
        if(message.debugSymbols) {
            this.setState({debugSymbols: message.debugSymbols})
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
        this.doFollow();
    }
   
    doFollow() {
        if (!this.state.isFollow) {
            return;
        }
        // TODO: document.querySelector("html").scrollTo(0, 0);
    }

    onMidiFile(midifile) {
        if (midifile) {
            const ppq = midifile.header.getTicksPerBeat();
            this.setState({duration: this.compileResult.midi.duration});
            this.setState({ppq});
        }
    }

    onViewChange(ev) {
        this.setState({selectedView: ev.target.value});
    }

    render() {
        const message = !this.state.midiData ? <div className="error-message">{MsgMissingMidiData}</div> : <span></span>;
        return (
            <div>
                <TransportComponent 
                    sheetDuration={this.state.duration} 
                    playerState={this.state.playerState} 
                    position={this.state.sheetTime}
                    ppq={this.state.ppq}>
                </TransportComponent>

                <h2> {this.state.sheetName} </h2>
                {message}
                <select value={this.state.selectedView} id="view-switch-ctrl" onChange={(ev)=>this.onViewChange(ev)}>
                    <option value="pianorollview">Piano Roll</option>
                    <option value="listview">MIDI Event List</option>
                </select>
                <MidiViewComponent 
                    viewType={this.state.selectedView}
                    debugSymbols={this.state.debugSymbols}
                    midiData={this.state.midiData} 
                    onMidiFile={(x) => this.onMidiFile(x)}></MidiViewComponent> 
            </div>
        );
    }
}