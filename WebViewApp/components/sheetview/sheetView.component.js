import React from "react";
import * as _ from 'lodash';
import { SourceViewComponent } from "./sourceView/sourceView.component";
import { TransportComponent } from "../shared/transport/transport.component";
import { BaseComponent } from "../shared/base/base.component";

function getSourceKey(sourceId) {
    return Number(sourceId).toString();
}

function isSheetFile(fileInfo) {
    return fileInfo.extension === '.sheet'
        || fileInfo.extension === '.template'
}

export class SheetViewComponent extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            sheetTime: 0,
            sheetfiles: {},
            mainSheet: null,
            text: "",
            playerState: ""
        }
       
        window.addEventListener('message', event => { // get vscode message
            const message = event.data;
            this.handleMessage(message);
        });
    }

    handleMessage(message) {
        if (message.sheetTime !== undefined) {
            this.updateSheetTime(message.sheetTime);
        }
        if (message.fileInfos) {
            this.updateFileInfos(message.fileInfos);
        }
        if(message.sheetEventInfos) {
            this.updateSheetEventInfos(message.sheetEventInfos);
        }
        if(message.playerState) {
            this.updatePlayerState(message.playerState);
        }
    }

    updatePlayerState(playerState) {
        this.setState({playerState: playerState.newState});
    }

    updateSheetTime(sheetTime) {
        this.setState({sheetTime: sheetTime});
    }

    updateFileInfos(infos) {
        const sheetfiles = _(infos)
            .map(x=> Object.assign(x, {eventInfos:[]}))
            .mapKeys(x=>getSourceKey(x.sourceId))
            .value()
        ;
        const mainSheet = _(sheetfiles).find(x=>x.extension==='.sheet');
        this.setState({sheetfiles: {}, mainSheet: {}}); // force hard reset
        this.setState({sheetfiles, mainSheet});
    }

    updateSheetEventInfos(sheetEventInfos) {
        for (let sourceKey in this.state.sheetfiles) {
            let source = this.state.sheetfiles[sourceKey];
            source.eventInfos.splice(0, source.eventInfos.length);
        }
        for(let sheetEventInfo of sheetEventInfos) {
            let source = this.state.sheetfiles[getSourceKey(sheetEventInfo.sourceId)];
            if (!source) {
                continue;
            }
            source.eventInfos.push(sheetEventInfo);
        }
        this.setState({sheetfiles: this.state.sheetfiles});
    }

    render() {
        let keys = _.keys(this.state.sheetfiles);
        let sortValues = (a, b) => {
            if (a == this.state.mainSheet.sourceId) {
                return -1;
            }
            if (b == this.state.mainSheet.sourceId) {
                return 1;
            }
            return a > b;
        };
        
        return (
            <div>
                <div style={{
                    position: "fixed",
                    top: "0px",
                    left: "20px",
                    right: "20px",
                    zIndex: "10",
                    background: "var(--vscode-editor-background)"
                }}>
                    <TransportComponent playerState={this.state.playerState} position={this.state.sheetTime}></TransportComponent>
                    <hr></hr>
                </div>
                <div style={{
                    marginTop: "100px"
                }}>
                    {
                        _(keys)
                        .filter(x=> isSheetFile(this.state.sheetfiles[x]))
                        .sort(sortValues)
                        .map(x=> <SourceViewComponent key={getSourceKey(this.state.sheetfiles[x].sourceId)} fileInfo={this.state.sheetfiles[x]}></SourceViewComponent> )
                        .value()
                    }
                </div>
            </div>
        );
    }
}