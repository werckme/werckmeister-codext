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
            let chars = sourceText[eventInfo.position] + sourceText[eventInfo.position+1]+ sourceText[eventInfo.position+2];
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