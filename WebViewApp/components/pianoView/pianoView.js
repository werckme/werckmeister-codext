import React from "react";
import * as _ from 'lodash';
import { BaseComponent } from "../shared/base/base.component";


// https://en.wikipedia.org/wiki/Musical_Symbols_(Unicode_block)
const Sharp = "♯";
const Flat = "♭";
const DurationNoneOption = "none";

export class PianoView extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            selectedDuration: DurationNoneOption,
            selectedEnharmonicEq: Sharp
        }
        this.durations = [DurationNoneOption, "64", "32", "16", "8", "4", "2", "1"];
        this.keyboardRef = React.createRef();
    }

    componentDidMount() {
        this.sendMessageToHost("pianoview-ready");
        if (this.keyboardRef.current) {
            this.keyboardRef.current.scrollLeft = 800;
        }
    }


    onKeyClick(note, octaveNr, acc) {
        const d = this.state.selectedDuration;
        if (acc === Flat) {
            note = this.getNextNoteName(note);
            note = note + "b";
        }
        if (acc === Sharp) {
            note = note + "#";
        }
        note = `${note}${this.getOctaveTokens(octaveNr)}`;
        if (this.state.selectedDuration && d !== 'none') {
            note = note + d;
        }
        this.sendMessageToHost("send-text", {text: note + " "});
        this.setState({selectedDuration: DurationNoneOption})
    }

    getNextNoteName(note) {
        if (note === 'g') {
            return 'a';
        }
        return String.fromCharCode(note.charCodeAt(0) + 1);
    }

    renderKeyLabel(name, octave, acc) {
        if (acc) {
            return (<span><b>{acc}</b></span>)
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

    renderKey(note, octaveNr, acc) {
        const title = note + this.getOctaveTokens(octaveNr);
        return (<button title={title} onClick={this.onKeyClick.bind(this, note, octaveNr, acc)}>{this.renderKeyLabel(note, octaveNr, acc)}</button>)
    }

    onDurationChange(event) {
        this.setState({ selectedDuration: event.target.value });
    };

    onEnharmonicEqChange(event) {
        this.setState({ selectedEnharmonicEq: event.target.value });
    };
    

    renderDurationControls() {
        return (
            <div className="control duration">
                {this.durations.map(duration => (
                    <label key={duration}>
                        <input
                            type="radio"
                            className={duration !== DurationNoneOption && this.state.selectedDuration === duration ? 'blink' : ''}
                            value={duration}
                            checked={this.state.selectedDuration === duration}
                            onChange={this.onDurationChange.bind(this)}
                        />
                        {duration}
                    </label>
                ))}
            </div>
        );
    }

    renderEnharmonicEqControls() {
        return (
            <div className="control enharmonicEq">
                <label key="#">
                    <input
                        type="radio"
                        value={Sharp}
                        checked={this.state.selectedEnharmonicEq === Sharp}
                        onChange={this.onEnharmonicEqChange.bind(this)}
                    />
                    <b>{Sharp}</b>
                </label>
                <label key="#">
                    <input
                        type="radio"
                        value={Flat}
                        checked={this.state.selectedEnharmonicEq === Flat}
                        onChange={this.onEnharmonicEqChange.bind(this)}
                    />
                    <b>{Flat}</b>
                </label>
            </div>
        );
    }

    renderOctave(octaveNr) {
        return(
            <div key={"octave-" + octaveNr} className={"octave octave-" + octaveNr}>
                <div className="key wk c">
                    {this.renderKey('c', octaveNr)}
                    <div className="key bk cs">
                        {this.renderKey('c', octaveNr, this.state.selectedEnharmonicEq)}
                    </div>
                </div>
                <div className="key wk d">
                    {this.renderKey('d', octaveNr)}
                    <div className="key bk ds">
                        {this.renderKey('d', octaveNr,  this.state.selectedEnharmonicEq)}
                    </div>
                </div>
                <div className="key wk e">
                    {this.renderKey('e', octaveNr)}
                </div>
                <div className="key wk f">
                    {this.renderKey('f', octaveNr)}
                        <div className="key bk fs">
                        {this.renderKey('f', octaveNr,  this.state.selectedEnharmonicEq)}
                    </div>                        
                </div>
                <div className="key wk g">
                    {this.renderKey('g', octaveNr)}
                        <div className="key bk gs">
                        {this.renderKey('g', octaveNr,  this.state.selectedEnharmonicEq)}
                    </div>
                </div>
                <div className="key wk a">
                    {this.renderKey('a', octaveNr)}
                    <div className="key bk as">
                        {this.renderKey('a', octaveNr,  this.state.selectedEnharmonicEq)}
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
            <>
                <div ref={this.keyboardRef} className="keyboard">
                    {octaves.map(octaveNr => this.renderOctave(octaveNr))}
                </div>
                <div className="controls">
                    {this.renderDurationControls()}
                    {this.renderEnharmonicEqControls()}
                </div>
            </>
        );
    }
}