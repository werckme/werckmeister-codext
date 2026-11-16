import React from "react";
import MIDIFile from "midifile";
import { TransportComponent } from "../shared/transport/transport.component";
import { BaseComponent } from "../shared/base/base.component";
import { MidiViewComponent } from "./midiview.component";
import { CompileResult, DebuggerMessage, DebugSymbol } from "./messages";

const MsgMissingMidiData = <div>
    No MIDI data available for this sheet.
</div>;

interface DebuggerState {
    sheetTime: number;
    playerState: string;
    /** in ticks */
    duration: number;
    midiData: string | null;
    sheetPath: string;
    sheetName: string;
    ppq: number;
    selectedView: string;
    debugSymbols: DebugSymbol[] | null;
    isFollowTransport: boolean;
    midiViewError: unknown;
}

/** the inspector: transport and the midi view of the compiled sheet */
export class DebuggerComponent extends BaseComponent<{}, DebuggerState> {
    lastFollowPosition = NaN;
    compileResult: CompileResult | null = null;
    midiViewComponent: MidiViewComponent | null = null;

    constructor(props: {}) {
        super(props);
        this.state = {
            sheetTime: 0,
            playerState: "",
            duration: 0,
            midiData: null,
            sheetPath: "",
            sheetName: "",
            ppq: 0,
            selectedView: "",
            debugSymbols: null,
            isFollowTransport: true,
            midiViewError: null
        };
        window.addEventListener('message', event => { // get vscode message
            this.handleMessage(event.data);
        });
    }

    componentDidMount() {
        this.sendMessageToHost("debuggerview-ready");
    }

    handleMessage(message: DebuggerMessage) {
        if (message.sheetTime !== undefined) {
            this.updateSheetTime(message.sheetTime);
        }
        if (message.playerState) {
            this.updatePlayerState(message.playerState);
        }
        if (message.duration) {
            this.updateDuration(message.duration);
        }
        if (message.compiled) {
            this.compileResult = message.compiled;
            this.setState({
                midiData: this.compileResult.midi.midiData,
                sheetPath: message.sheetPath || "",
                sheetName: message.sheetName || ""
            });
        }
        if (message.debugSymbols) {
            this.setState({ debugSymbols: message.debugSymbols });
        }
        if (message.navigateTo) {
            if (!this.compileResult || !this.compileResult.midi || !this.compileResult.midi.sources) {
                return;
            }
            const navigateTo = message.navigateTo;
            const source = this.compileResult.midi.sources.find(x => x.path === navigateTo.documentPath);
            if (!source || !this.midiViewComponent) {
                return;
            }
            navigateTo.sourceId = source.sourceId;
            this.midiViewComponent.navigateTo(navigateTo);
        }
    }

    updateDuration(duration: number) {
        this.setState({ duration: duration });
    }

    updatePlayerState(playerState: { newState: string }) {
        this.setState({ playerState: playerState.newState });
    }

    updateSheetTime(sheetTime: number) {
        this.setState({ sheetTime: sheetTime });
        this.follow(sheetTime);
    }

    /** scrolls the view to the current play position */
    follow(sheetTime: number) {
        if (!this.state.isFollowTransport) {
            return;
        }
        const positionChanged = sheetTime !== this.lastFollowPosition;
        if (!positionChanged) {
            return;
        }
        this.lastFollowPosition = sheetTime;
        const parent = document.querySelector("html")!;
        const maxw = parent.scrollWidth;
        const maxd = this.state.duration / this.state.ppq;
        const x = Math.floor(sheetTime * maxw / maxd);
        const y = parent.scrollTop;
        parent.scrollTo(x, y);
    }

    onMidiFile(midifile: MIDIFile | null) {
        if (midifile && this.compileResult) {
            const ppq = midifile.header.getTicksPerBeat();
            this.setState({
                duration: this.compileResult.midi.duration,
                ppq,
                midiViewError: null
            });
        }
    }

    onViewChange(ev: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ selectedView: ev.target.value });
    }

    onGoToEventSource(eventInfo: DebugSymbol) {
        const sources = this.compileResult ? this.compileResult.midi.sources : [];
        eventInfo.documentPath = (sources.find(x => x.sourceId === eventInfo.documentSourceId) || { path: undefined }).path;
        this.sendMessageToHost("goToEventSource", { eventInfo });
    }

    onMidiViewError(ex: unknown) {
        this.setState({ midiViewError: ex });
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
                    followTransportChange={(v) => this.setState({ isFollowTransport: v })}>
                </TransportComponent>
                <h2> {this.state.sheetName} </h2>
                {message}
                <select value={this.state.selectedView} id="view-switch-ctrl" onChange={(ev) => this.onViewChange(ev)}>
                    <option value="pianorollview">Piano Roll</option>
                    <option value="listview">MIDI Event List</option>
                </select>
                <MidiViewComponent
                    viewType={this.state.selectedView}
                    debugSymbols={this.state.debugSymbols}
                    midiData={this.state.midiData}
                    onMidiFile={(x) => this.onMidiFile(x)}
                    ref={el => { this.midiViewComponent = el; }}
                    onGoToEventSource={evInfo => this.onGoToEventSource(evInfo)}
                    onError={ex => this.onMidiViewError(ex)}>
                </MidiViewComponent>
            </div>
        );
    }
}
