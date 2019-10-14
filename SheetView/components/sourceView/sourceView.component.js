import React from "react";
import * as ace from 'werckmeister-ace-build';
import 'werckmeister-ace-build/src-noconflict/mode-sheet';

const ContainerStyle = {
    position: 'relative',
    height: '800px'
}

const EditorStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute'
}



const MarkerClass = "sheet-marker";

function getRowAndColumn(text, position) {
    let row = 0;
    let col = 0;
    if (position >= text.length) {
        return null;
    }
    const _isNewline = (char, nextchar) => { 
        if (char === '\n') {
            return 1;
        }
        if (char === '\r' && nextchar === '\n') {
            return 2;
        }
    }
    for(let idx=0; idx < position; ++idx) {
        let char = text[idx];
        let skipChars = _isNewline(char, text[idx+1]);
        let isNewline = !!skipChars;
        if (isNewline) {
            ++row;
            col = 0;
            idx += skipChars - 1;
            continue;
        }
        ++col;
    }
    return {row, col};
}

export class SourceViewComponent extends React.Component {
    constructor(props) {
        super(props);
        this.refEditor = null;
        this.editor = null;
        this.state = {
            fileInfo: this.props.fileInfo
        }
        this.positionMarkerMap = {};
    }

    componentDidMount() {
        this.editor = ace.edit(this.refEditor);
        this.editor.setOptions({
            showGutter: false,
            printMargin: false,
            readOnly: true
        });
        this.editor.session.setMode("ace/mode/sheet");
    }

    updateRef(item) {
        this.refEditor = item;
    }

    updateEventMarkers() {
        const sourceText = this.state.fileInfo.text;
        const toRemove = _(this.positionMarkerMap)
            .keys()
            .without( ..._(this.state.fileInfo.eventInfos).map(x=>x.beginPosition).value() )
            .value();
        for (let key of toRemove) {
            let aceId = this.positionMarkerMap[key];
            this.editor.session.removeMarker(aceId);
            delete this.positionMarkerMap[key];
        }        
        for (let eventInfo of this.state.fileInfo.eventInfos) {
            if (!eventInfo.beginPosition || !eventInfo.endPosition) {
                continue;
            }
            let keyPosition = eventInfo.beginPosition;
            if (keyPosition in this.positionMarkerMap) {
                continue;
            }
            let from = getRowAndColumn(sourceText, eventInfo.beginPosition);
            let to = getRowAndColumn(sourceText, eventInfo.endPosition);
            let aceRange = new ace.Range(from.row, from.col, to.row, to.col);
            let marker = this.editor.session.addMarker(aceRange, MarkerClass, null, true);
            this.positionMarkerMap[keyPosition] = marker;
        }
    }

    render() {
        const sourceText = this.state.fileInfo.text;
        this.updateEventMarkers();
        return (
            <div style={ContainerStyle}>
                <hr></hr>
                {this.state.fileInfo.eventInfos.length}
                <h5>{this.state.fileInfo.basename}</h5>
                <div ref={this.updateRef.bind(this)} style={EditorStyle}>
                    {sourceText}
                </div>
            </div>
        );
    }
}