import React from "react";
import * as _ from 'lodash';
import { TransportComponent } from "../shared/transport/transport.component";
import { BaseComponent } from "../shared/base/base.component";
import { MidiViewComponent } from "./midiview.component";

const MsgMissingMidiData = <div>
    No MIDI data available for this sheet. 
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
            debugSymbols: null,
            isFollowTransport: true,
            midiViewError: null
        }
        this.lastFollowPosition = NaN;
        this.compileResult = null;
        this.midiViewComponent = null;
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
        if(message.navigateTo) {
            if (!this.compileResult || !this.compileResult.midi || !this.compileResult.midi.sources) {
                return;
            }
            const navigateTo = message.navigateTo;
            const source = this.compileResult.midi.sources.find(x => x.path === navigateTo.documentPath);
            if (!source) {
                return;
            }
            navigateTo.sourceId = source.sourceId;
            this.midiViewComponent.navigateTo(navigateTo);
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
        this.follow(sheetTime);
    }

    follow(sheetTime) {
        if (!this.state.isFollowTransport) {
            return;
        }
        const positionChanged = sheetTime !== this.lastFollowPosition;
        if (!positionChanged) {
            return;
        }
        this.lastFollowPosition = sheetTime;
        const parent = document.querySelector("html");
        const maxw = parent.scrollWidth;
        const maxd = this.state.duration / this.state.ppq;
        const x = Math.floor(sheetTime * maxw / maxd);
        const y = parent.scrollTop;
        parent.scrollTo(x, y)
    }

    onMidiFile(midifile) {
        if (midifile) {
            const ppq = midifile.header.getTicksPerBeat();
            this.setState({
                duration: this.compileResult.midi.duration,
                ppq,
                midiViewError: null
            });
        
        }
    }

    onViewChange(ev) {
        this.setState({selectedView: ev.target.value});
    }

    onGoToEventSource(eventInfo) {
        eventInfo.documentPath = (this.compileResult.midi.sources.find(x => x.sourceId === eventInfo.documentSourceId) || {}).path;
        this.sendMessageToHost("goToEventSource", {eventInfo});
    }

    onMidiViewError(ex) {
        this.setState({midiViewError: ex});
    }

    render() {
        const message = (!this.state.midiData || this.state.midiViewError) ? <div className="error-message">{MsgMissingMidiData}</div> : <span></span>;
        return (
            <div>
                <TransportComponent 
                    sheetDuration={this.state.duration} 
                    playerState={this.state.playerState} 
                    position={this.state.sheetTime}
                    ppq={this.state.ppq}
                    followTransport={this.state.isFollowTransport}
                    followTransportChange={(v) => this.setState({isFollowTransport: v})}>
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
                    onMidiFile={(x) => this.onMidiFile(x)}
                    ref={el => (this.midiViewComponent = el)}
                    onGoToEventSource={evInfo => this.onGoToEventSource(evInfo)}
                    onError={ex=>this.onMidiViewError(ex)}>
                </MidiViewComponent> 
            </div>
        );
    }
}