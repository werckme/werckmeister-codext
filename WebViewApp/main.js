import ReactDOM from 'react-dom';
import React from 'react';
import { TransportViewComponent } from './components/transportView/transportView.component';
import { DebuggerComponent } from './components/debugger/debugger.component';
import { PianoView } from './components/pianoView/pianoView';

const PianoViewId = 'piano-view-main-component';
const TransportViewId = 'transport-main-component';
const DebuggerId = 'debugger-main-component';

const transportView = document.getElementById(TransportViewId);
if (transportView) {
    ReactDOM.render(<TransportViewComponent />, transportView);
}

const pianoView = document.getElementById(PianoViewId);
if (pianoView) {
    ReactDOM.render(<PianoView />, pianoView);
}


const debugger_ = document.getElementById(DebuggerId);
if (debugger_) {
    ReactDOM.render(<DebuggerComponent></DebuggerComponent>, debugger_)
}