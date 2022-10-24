import ReactDOM from 'react-dom';
import React from 'react';
import { SheetViewComponent } from './components/sheetview/sheetView.component';
import { TransportViewComponent } from './components/transportView/transportView.component';
import { DebuggerComponent } from './components/debugger/debugger.component';

const SheetViewId = 'sheet-view-main-component';
const PianoViewId = 'piano-view-main-component';
const TransportViewId = 'transport-main-component';
const DebuggerId = 'debugger-main-component';

const sheetView = document.getElementById(SheetViewId);
if (sheetView) {
    ReactDOM.render(<SheetViewComponent />, sheetView);
}
const transportView = document.getElementById(TransportViewId);
if (transportView) {
    ReactDOM.render(<TransportViewComponent />, transportView);
}

const debugger_ = document.getElementById(DebuggerId);
if (debugger_) {
    ReactDOM.render(<DebuggerComponent></DebuggerComponent>, debugger_)
}