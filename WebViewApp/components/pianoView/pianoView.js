import React from "react";
import * as _ from 'lodash';
import { TransportComponent } from "../shared/transport/transport.component";
import { BaseComponent } from "../shared/base/base.component";

export class PianoView extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
        this.sendMessageToHost("pianoview-ready");
    }


    onKeyClick(note) {
       this.sendMessageToHost("send-text", {text: note + " "});
    }

    renderKeyLabel(name, octave, enharmonicEq) {
        if (enharmonicEq) {
            return (<span>{'#'}</span>)
        }
        if (name !== 'c' || octave !== 0) {
            return <></>;
        }
        return (<span>{name}</span>)
    }

    getOctaveTokens(octaveNr) {
        if (octaveNr === 0) {
            return '';
        }
        const tokens = []
        const token = octaveNr > 0 ? '\'' : ',';
        let c = Math.abs(octaveNr);
        while(c-- > 0) {
            tokens.push(token);
        }
        return tokens.join('')
    }

    renderKey(name, octaveNr, enharmonicEq) {
        let note = `${name}${this.getOctaveTokens(octaveNr)}`;
        return (<button title={note} onClick={this.onKeyClick.bind(this, note)}>{this.renderKeyLabel(name, octaveNr, enharmonicEq)}</button>)
    }

    renderOctave(octaveNr) {
        return(
            <div key={"octave-" + octaveNr} className={"octave octave-" + octaveNr}>
                <div className="key wk c">
                    {this.renderKey('c', octaveNr)}
                    <div className="key bk cs">
                        {this.renderKey('c#', octaveNr, 'db')}
                    </div>
                </div>
                <div className="key wk d">
                    {this.renderKey('d', octaveNr)}
                    <div className="key bk ds">
                        {this.renderKey('d#', octaveNr, 'eb')}
                    </div>
                </div>
                <div className="key wk e">
                    {this.renderKey('e', octaveNr)}
                </div>
                <div className="key wk f">
                    {this.renderKey('f', octaveNr)}
                        <div className="key bk fs">
                        {this.renderKey('f#', octaveNr, 'gb')}
                    </div>                        
                </div>
                <div className="key wk g">
                    {this.renderKey('g', octaveNr)}
                        <div className="key bk gs">
                        {this.renderKey('g#', octaveNr, 'ab')}
                    </div>
                </div>
                <div className="key wk a">
                    {this.renderKey('a', octaveNr)}
                    <div className="key bk as">
                        {this.renderKey('a#', octaveNr, 'bb')}
                    </div>
                </div>
                <div className="key wk b">
                    {this.renderKey('b', octaveNr)}
                </div> 
            </div>
        );
    }


    render() {
        const octaves = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
        return (
            <div className="keyboard">
                {octaves.map(octaveNr => this.renderOctave(octaveNr))}
            </div>
        );
    }
}