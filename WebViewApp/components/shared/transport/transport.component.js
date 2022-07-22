import React from "react";
import { playIcon } from "./play.icon";
import { stopIcon } from "./stop.icon";
import { BaseComponent } from "../base/base.component";
import { PlayerState } from "../com/playerStates";
import { pauseIcon } from "./pause.icon";
import { vstIcon } from "./vst.icon";
import { SwitchComponent } from "../com/switch.component";
import { followIcon } from "./follow.icon";
export class TransportComponent extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            position: 0,
            begin: 0
        }
        this.updateBeginBounced = _.debounce(this.updateBegin.bind(this), 100);
    }

    onStopClicked() {
        this.sendMessageToHost("player-stop");
    }

    onPlayClicked() {
        this.sendMessageToHost("player-play", { begin: this.state.begin });
    }

    onPauseClicked() {
        this.sendMessageToHost("player-pause");
    }

    updateBegin() {
        this.sendMessageToHost("player-update-range", { begin: this.state.begin });
    }

    onBeginChanged(ev) {
        const value = ev.target.value;
        this.setState({ begin: value })
        this.updateBeginBounced();
    }

    inbetweenStates() {
        return this.props.playerState === PlayerState.StartPlaying
            || this.props.playerState === PlayerState.Stopping
            || this.props.playerState === PlayerState.Pausing;
    }

    isConnectedToVst() {
        return this.props.playerState === PlayerState.ConnectedToVst;
    }

    playerControls() {
        if (this.props.playerState === PlayerState.ConnectedToVst) {
            return <div id="vsticon" title="Transport control via your DAW">{vstIcon()}</div>;
        }
        return (
            <React.Fragment>
                {
                    this.props.playerState !== PlayerState.Playing ?
                        <button className="btn-play" onClick={this.onPlayClicked.bind(this)} disabled={this.inbetweenStates()}>
                            {playIcon()}
                        </button>
                        :
                        <button className="btn-paused" onClick={this.onPauseClicked.bind(this)} disabled={this.inbetweenStates()}>
                            {pauseIcon()}
                        </button>
                }
                <button className="btn-stop" onClick={this.onStopClicked.bind(this)} disabled={this.inbetweenStates()}>
                    {stopIcon()}
                </button>
            </React.Fragment>
        );
    }

    render() {
        const position = this.props.position || 0;
        const { followTransport, followTransportChange } = this.props;
        return (
            <div>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .ccontainer {
                        padding: 4px 2px 2px 2px;
                        display: grid;
                        grid-template-rows: 25px 25px 25px;
                        grid-template-columns: 48px 48px auto 77px;
                        grid-template-areas: "play stop display range-from" "play stop display range-to" "status-bar status-bar status-bar status-bar";
                        width: 288px;
                        font-weight: lighter;
                        font-family: monospace;
                    }
                    .btn-play, .btn-paused {
                        grid-area: play;
                    }
                    
                    .btn-stop {
                        grid-area: stop;
                    }
                    button {
                        cursor: default;
                        font-size: 25px;
                        height: 46px;
                        border: none;
                        margin: 2px 2px 0px 0px;
                        background: #0000;
                    }
                    button svg {
                        position: relative;
                        top: 3px;
                        fill: var(--vscode-editor-foreground);
                    }
                    .display {
                        grid-area: display;
                        font-size: 45px;
                        text-align: right;
                        user-select: none;
                        cursor: default;
                    }
                    .position {
                        margin: 0px;
                        padding-right: 7px;
                        position: relative;
                        top: -10px;
                    }
                    input {
                        border: none;
                        color: var(--vscode-editor-foreground);
                        text-align: right;
                    }
                    #vsticon {
                        grid-row-start: play;
                        grid-column-start: play;
                        grid-row-end: stop;
                        grid-column-end: stop;
                        width: 82px;
                        margin: 5px;
                    }
                    #status-bar {
                        grid-area: status-bar;
                        display: flex;
                        width: 100%;
                        flex-wrap: nowrap;
                        flex-direction: row;
                        align-content: space-between;
                        align-items: flex-end;
                    }
                    .transport-state {
                        width: 100%;
                    }
                    .switch-component {
                        margin-right: 15px;
                    }
                    .switch-component svg {
                        width: 20px;
                        opacity: 0.7;
                    }
                    .switch-component.isOn svg {
                        width: 20px;
                        color: cornflowerblue;
                        filter: drop-shadow(2px 2px 11px cornflowerblue);
                    }
                `}}></style>
                <div className="ccontainer">
                    {this.playerControls()}
                    <div className="display">
                        <span>{_.padStart(position.toFixed(2), 2 + 4, "0")}</span>
                    </div>
                    <input className="range-from" type="number"
                        value={this.state.begin}
                        title="Begin Time (qtrs)"
                        onChange={this.onBeginChanged.bind(this)}
                        disabled={this.props.playerState === PlayerState.Playing || this.isConnectedToVst()}
                        min="0" />
                    <input title="End Time (qtrs)" className="range-to" type="number" value={this.props.sheetDuration.toFixed(0) / this.props.ppq || 1} disabled />
                    <div id="status-bar">
                        <span className="transport-state" style={{ visibility: this.isConnectedToVst() ? "hidden" : "visible" }}>{this.props.playerState || 'Stopped'}</span>
                        <SwitchComponent icon={followIcon()} switchValue={followTransport} onChange={followTransportChange} title="Turn Follow Mode On/Off" id="followSwitch"></SwitchComponent>
                    </div>
                </div>
            </div>
        );
    }
}