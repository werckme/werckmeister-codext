import React from "react";
import * as _ from 'lodash';
import { SourceViewComponent } from "../sourceView/sourceView.component";

function getSourceKey(sourceId) {
    return Number(sourceId).toString();
}

function isSheetFile(fileInfo) {
    return fileInfo.extension === '.sheet'
        || fileInfo.extension === '.template'
}

export class MainComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sheetTime: 0,
            sheetfiles: {},
            mainSheet: null,
            text: ""
        }
       
        window.addEventListener('message', event => { // get vscode message
            const message = event.data;
            this.handleMessage(message);
        });
    }

    handleMessage(message) {
        if (message.sheetTime) {
            this.updateSheetTime(message.sheetTime);
        }
        if (message.fileInfos) {
            this.updateFileInfos(message.fileInfos);
        }
        if(message.sheetEventInfos) {
            this.updateSheetEventInfos(message.sheetEventInfos);
        }
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
        console.log(sheetfiles);
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
                //console.log("?", sheetEventInfo.sourceId);
                continue;
            }
            //console.log("!", sheetEventInfo.sourceId);
            source.eventInfos.push(sheetEventInfo);
        }
        this.setState({sheetfiles: this.state.sheetfiles});
    }

    render() {
        let keys = _.keys(this.state.sheetfiles);
        let sortValues = (a, b) => {
            if (a === this.state.mainSheet.sourceId) {
                return -1;
            }
            if (b === this.state.mainSheet.sourceId) {
                return 1;
            }
            return a > b;
        };
        
        return (
            <div>
                <h4>-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=</h4>
                <h5> { this.state.sheetTime } </h5>  
                {
                    _(keys)
                    .filter(x=> isSheetFile(this.state.sheetfiles[x]))
                    //.filter(x=> x == this.state.mainSheet.sourceId)
                    .sort(sortValues)
                    .map(x=> <SourceViewComponent key={getSourceKey(this.state.sheetfiles[x].sourceId)} fileInfo={this.state.sheetfiles[x]}></SourceViewComponent> )
                    .value()
                }
            </div>
        );
    }
}