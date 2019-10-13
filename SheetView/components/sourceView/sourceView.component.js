import React from "react";


export class SourceViewComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fileInfo: this.props.fileInfo
        }
    }


    render() {
        const sourceText = this.state.fileInfo.text;
        let text = "";
        for (let eventInfo of this.state.fileInfo.eventInfos) {
            if (!eventInfo.beginPosition || !eventInfo.endPosition) {
                continue;
            }
            let chars = sourceText.substr(eventInfo.beginPosition, eventInfo.endPosition - eventInfo.beginPosition);
            text += `${chars} `;
        }
        return (
            <div>
                <hr></hr>
                <h5>{this.state.fileInfo.basename}</h5>
                { text }
            </div>
        );
    }
}