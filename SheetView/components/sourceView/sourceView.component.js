import React from "react";
import * as ace from 'ace-builds';

const EditorStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute'
}

export class SourceViewComponent extends React.Component {
    constructor(props) {
        super(props);
        this.refEditor = null;
        this.editor = null;
        this.state = {
            fileInfo: this.props.fileInfo
        }
    }

    componentDidMount() {
        this.editor = ace.edit(this.refEditor);
        this.editor.setOptions({
            showGutter: false,
            printMargin: false,
            readOnly: true
        });
        
    }

    updateRef(item) {
        this.refEditor = item;
    }

    render() {
        const sourceText = this.state.fileInfo.text;
        // let text = "";
        // for (let eventInfo of this.state.fileInfo.eventInfos) {
        //     if (!eventInfo.beginPosition || !eventInfo.endPosition) {
        //         continue;
        //     }
        //     let chars = sourceText.substr(eventInfo.beginPosition, eventInfo.endPosition - eventInfo.beginPosition);
        //     text += `${chars} `;
        // }
        return (
            <div>
                <hr></hr>
                <h5>{this.state.fileInfo.basename}</h5>
                <div ref={this.updateRef.bind(this)} style={EditorStyle}>
                    {sourceText}
                </div>
            </div>
        );
    }
}