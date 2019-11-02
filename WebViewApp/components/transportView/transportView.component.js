import React from "react";
import * as _ from 'lodash';
import { TransportComponent } from "../shared/transport/transport.component";
import { BaseComponent } from "../shared/base/base.component";

export class TransportViewComponent extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            sheetTime: 0,
            sheetfiles: {},
            mainSheet: null,
            text: "",
            playerState: "",
            duration: 0
        }
       
        window.addEventListener('message', event => { // get vscode message
            const message = event.data;
            this.handleMessage(message);
        });
    }

    componentDidMount() {
        this.sendMessageToHost("transportview-ready");
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