import React from "react";
import { TransportComponent } from "../shared/transport/transport.component";
import { BaseComponent } from "../shared/base/base.component";

/** messages sent by the extension host to the transport view */
export interface TransportMessage {
    sheetTime?: number;
    playerState?: { newState: string };
    duration?: number;
}

interface TransportViewState {
    sheetTime: number;
    playerState: string;
    duration: number;
}

export class TransportViewComponent extends BaseComponent<{}, TransportViewState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            sheetTime: 0,
            playerState: "",
            duration: 0
        };
        window.addEventListener('message', event => { // get vscode message
            this.handleMessage(event.data);
        });
    }

    componentDidMount() {
        this.sendMessageToHost("transportview-ready");
    }

    handleMessage(message: TransportMessage) {
        if (message.sheetTime !== undefined) {
            this.updateSheetTime(message.sheetTime);
        }
        if (message.playerState) {
            this.updatePlayerState(message.playerState);
        }
        if (message.duration) {
            this.updateDuration(message.duration);
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
    }

    render() {
        return (
            <div>
                <TransportComponent
                    sheetDuration={this.state.duration}
                    playerState={this.state.playerState}
                    position={this.state.sheetTime}>
                </TransportComponent>
            </div>
        );
    }
}
