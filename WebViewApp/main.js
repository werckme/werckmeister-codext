import ReactDOM from 'react-dom';
import React from 'react';
import { SheetViewComponent } from './components/sheetview/sheetView.component';
import { PianoViewComponent } from './components/pianoview/pianoView.component';

const SheetViewId = 'sheet-view-main-component';
const PianoViewId = 'piano-view-main-component';

const sheetView = document.getElementById(SheetViewId);
if (sheetView) {
    ReactDOM.render(<SheetViewComponent />, sheetView);
}
const pianoView = document.getElementById(PianoViewId);
if (pianoView) {
    ReactDOM.render(<PianoViewComponent />, pianoView);
}