import React from "react";
import * as ace from 'werckmeister-ace-build';
import 'werckmeister-ace-build/src-noconflict/mode-sheet';
import 'werckmeister-ace-build/src-noconflict/theme-dracula';
import { BaseComponent } from "../../shared/base/base.component";

const ContainerStyle = {
    position: 'static',
    width: '100%'
}

const EditorWrapperStyle = {
    position: 'relative',
    height: '500px'
}

const EditorStyle = {
    width: '100%',
    height: '100%',
    position: 'absolute',
}

const EditorOptions = {
    showGutter: false,
    printMargin: false,
    readOnly: true,
    highlightActiveLine: false,
    highlightSelectedWord: false,
};

const MarkerClass = "sheet-marker";

function dos2Unix(text) {
    if (!text) {
        return text;
    }
    return text.replace(/\r\n/g, ' \n');
}

function getRowAndColumn(text, position, fixTrailingWhitespaces) {
    while(position > 0 && fixTrailingWhitespaces) {
        // remove trailing whitespaces
        let char = text[position-1];
        let charIsWhiteSpace = /\s/.test(char);
        if (!charIsWhiteSpace) {
            break;
        }
        --position;
    }
    let row = 0;
    let col = 0;
    if (position >= text.length) {
        return null;
    }
    const _isNewline = (char) => { 
        // assuming text is unixstyle LF
        if (char === '\n') {
            return true;
        }
        return false;
    }
    for(let idx=0; idx < position; ++idx) {
        let char = text[idx];
        if (_isNewline(char)) {
            ++row;
            col = 0;
            continue;
        }
        ++col;
    }
    return {row, col};
}

export class SourceViewComponent extends BaseComponent {
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
        this.editor.setOptions(EditorOptions);
        this.editor.session.setMode("ace/mode/sheet");
        this.editor.setTheme("ace/theme/dracula");
    }

    updateRef(item) {
        this.refEditor = item;
    }

    updateEventMarkers() {
        if (!this.editor && !this.text) {
            return;
        }
        const sourceText = this.editor.session.doc.getValue();
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
            let to = getRowAndColumn(sourceText, eventInfo.endPosition, true);
            let aceRange = new ace.Range(from.row, from.col, to.row, to.col);
            let marker = this.editor.session.addMarker(aceRange, MarkerClass, null, true);
            this.positionMarkerMap[keyPosition] = marker;
        }
    }

    render() {
        const sourceText = dos2Unix(this.state.fileInfo.text);
        this.updateEventMarkers();
        return (
            <div style={ContainerStyle}>
                <hr></hr>
                <h5>{this.state.fileInfo.basename}</h5>
                <div style={EditorWrapperStyle}>
                    <div ref={this.updateRef.bind(this)} style={EditorStyle}>
                        {sourceText}
                    </div>
                </div>
            </div>
        );
    }
}