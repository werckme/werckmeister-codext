import React from "react";
import * as _ from 'lodash';

export class MainComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sheetTime: 0,
            sheetfile: {}
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
    }

    updateSheetTime(sheetTime) {
        this.setState({sheetTime: sheetTime});
    }

    updateFileInfos(infos) {
        console.log(infos);
        const sheetfile = _(infos).find(x=>x.extension==='.sheet');
        console.log(sheetfile);
        this.setState({sheetfile: sheetfile});
    }

    render() {
        return (
            <div>
                <h4>Sheet: {this.state.sheetfile ? this.state.sheetfile.basename : 'no sheet'}</h4>
                { this.state.sheetTime }
                <br></br>
                <code>
                    { this.state.sheetfile.text }
                </code>
            </div>
        );
    }
}