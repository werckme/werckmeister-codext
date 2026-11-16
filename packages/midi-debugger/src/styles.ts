/**
 * Styles of the debugger views, injected into the document on first use.
 */
export const styles = `
/* PIANO ROLL VIEW */

.piano-roll {
    margin-left: 50px;
    padding-top: 7px;
}

.piano-roll .track {
    white-space: nowrap;
}

.piano-roll .grid-style {
    color: red;
    background-color: red;
    font-size: 12px;
}

.piano-roll .grid-style .grid-element {
    background: rgba(0, 0, 0, 0.1);
}

.track + .track {
    position: relative;
    border-top: 2px solid black;

}

.track .track-title {
    position: absolute;
    top: 0;
    font-size: 12px;
    font-weight: bold;
    font-family: monospace;
}

.track.track-empty {
    display: none;
}

.track.track-empty + .track {
    border-top: none;
    padding-top: 0px;
    margin-top: 0px;
}

.piano-roll .pitch-group {
    display: none;
}

.piano-roll .pitch-group.pitch-group-hasvalue {
    display: flex;
    justify-content: center;
    flex-direction: column;
    position: relative;
    height: 25px;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.2);
}


.piano-roll .event {
    display: inline-flex;
    position: absolute;
    background-color: red;
    border: 1px solid black;
    height: 13px;
    padding: 0px 0;
    cursor: default;
}

.piano-roll .event:hover {
    box-shadow: 0 0 0px 2px black;
}

.piano-roll .event span {
    color: black;
    font-size: 12px;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: default;
}

.piano-roll .cues {
    position: relative;
}

.piano-roll .cues .cue-event {
    position: absolute;
    z-index: 10;
    background-color: yellow;
    box-shadow: 0 0 0px 2px black;
    width: 15px;
    height: 15px;
    clip-path: polygon(0% 0%, 100% 0, 100% 65%, 48% 100%, 0 65%);
}

.found-by-search {
    border: 2px solid yellow;
}


/* LIST VIEW */
.wm-dbg-listview {
    font-family: monospace;
    font-size: 12px;
    border-collapse: collapse;
    margin: auto;
    min-width: 625px;
}    

.wm-dbg-listview th, td {
    border-right: 1px solid lightgrey;
    border-left: 1px solid lightgrey;
}

.wm-dbg-listview th, td {
    padding: 3px;
}


.wm-dbg-listview thead tr {
    position: sticky;
    top: 0px;
    z-index: 1;
    background: #132e3d;
    color: white;
}

.wm-dbg-listview tr.note-off {
    opacity: 0.7;
}
.wm-dbg-track-0
, .track-0 .event 
{
    background-color: white;
}
.wm-dbg-track-1 
, .track-1 .event
{
    background-color: #6F69AC;
}
.wm-dbg-track-2 
, .track-2 .event
{
    background-color: #95DAC1;
}
.wm-dbg-track-3
, .track-3 .event
{
    background-color: #FFEBA1;
}
.wm-dbg-track-4 
, .track-4 .event
{
    background-color: #FD6F96;
}
.wm-dbg-track-5 
, .track-5 .event
{
    background-color: #3DB2FF;
}
.wm-dbg-track-6 
, .track-6 .event
{
    background-color: #FFB830;
}
.wm-dbg-track-7 
, .track-7 .event
{
    background-color: #FF2442;
}
.wm-dbg-track-8 
, .track-8 .event
{
    background-color: #FF4848;
}
.wm-dbg-track-9 
, .track-9 .event
{
    background-color: #AC66CC;
}
.wm-dbg-track-10 
, .track-10 .event
{
    background-color: #F37121;
}
.wm-dbg-track-11 
, .track-11 .event
{
    background-color: #F5B461;
}
.wm-dbg-track-12 
, .track-12 .event
{
    background-color: #D92027;
}
.wm-dbg-track-13 
, .track-13 .event
{
    background-color: #BC658D;
}
.wm-dbg-track-14 
, .track-14 .event
{
    background-color: #8D448B;
}
.wm-dbg-track-15 
, .track-15 .event
{
    background-color: #DF0E62;
}
.wm-dbg-track-16 
, .track-16 .event
{
    background-color: #FF2E4C;
}


/* DATA FLOW VIEW */
.wm-dbg-dataflowview  {
    font-family: monospace;
    font-size: 12px;
}    

.wm-dbg-dataflowview .events {
    display: flex;
    flex-wrap: wrap;
}
.wm-dbg-dataflowview .event-date {
    border: 3px solid lightgrey;
    border-radius: 15px;
    padding: 15px;
    margin: 5px;
    min-width: 115px;
    min-height: 80px;
}
.wm-dbg-dataflowview .event-date.note-on{
    background-color: #f0b6fa;
}

.wm-dbg-dataflowview .event-date.note-off{
    background-color: #fae4b6;
}


/* CHKBX GRP */
.chkbx-grp {
    display: flex;
    margin-bottom: 1em;
    position: fixed;
    top: 15px;
    padding-bottom: 5px;
    z-index: 1;
    white-space: nowrap;
    justify-content: center;
    flex-direction: column;
    align-items: flex-start;
}

.chkbx-grp label {
    position: relative;
    top: -2px;
}

.chkbx-grp > div {
    margin-left: 3px;
    padding: 1px 5px;
    border: 1px solid slategray;
    border-radius: 5px;
    font-size: 13px;
    overflow: hidden;
    width: 20px;
    text-overflow: ellipsis;
    transition: width 100ms linear;
    transition-delay: 1s;
}

.chkbx-grp:hover > div {
    transition: width 300ms linear;
    width: 100%;
}




/*
@iterations: 127;
.loop (@i) when (@i > 0) {
    .event.velocity-@{i} {
        opacity: (@i/127);
    }
    .loop(@i - 1);
}
.loop (@iterations);

https://jsonformatter.org/less-to-css
*/

.event.velocity-127 {
    filter: saturate(1);
}
.event.velocity-126 {
    filter: saturate(0.99212598425197);
}
.event.velocity-125 {
    filter: saturate(0.98425196850394);
}
.event.velocity-124 {
    filter: saturate(0.97637795275591);
}
.event.velocity-123 {
    filter: saturate(0.96850393700787);
}
.event.velocity-122 {
    filter: saturate(0.96062992125984);
}
.event.velocity-121 {
    filter: saturate(0.95275590551181);
}
.event.velocity-120 {
    filter: saturate(0.94488188976378);
}
.event.velocity-119 {
    filter: saturate(0.93700787401575);
}
.event.velocity-118 {
    filter: saturate(0.92913385826772);
}
.event.velocity-117 {
    filter: saturate(0.92125984251969);
}
.event.velocity-116 {
    filter: saturate(0.91338582677165);
}
.event.velocity-115 {
    filter: saturate(0.90551181102362);
}
.event.velocity-114 {
    filter: saturate(0.89763779527559);
}
.event.velocity-113 {
    filter: saturate(0.88976377952756);
}
.event.velocity-112 {
    filter: saturate(0.88188976377953);
}
.event.velocity-111 {
    filter: saturate(0.8740157480315);
}
.event.velocity-110 {
    filter: saturate(0.86614173228346);
}
.event.velocity-109 {
    filter: saturate(0.85826771653543);
}
.event.velocity-108 {
    filter: saturate(0.8503937007874);
}
.event.velocity-107 {
    filter: saturate(0.84251968503937);
}
.event.velocity-106 {
    filter: saturate(0.83464566929134);
}
.event.velocity-105 {
    filter: saturate(0.82677165354331);
}
.event.velocity-104 {
    filter: saturate(0.81889763779528);
}
.event.velocity-103 {
    filter: saturate(0.81102362204724);
}
.event.velocity-102 {
    filter: saturate(0.80314960629921);
}
.event.velocity-101 {
    filter: saturate(0.79527559055118);
}
.event.velocity-100 {
    filter: saturate(0.78740157480315);
}
.event.velocity-99 {
    filter: saturate(0.77952755905512);
}
.event.velocity-98 {
    filter: saturate(0.77165354330709);
}
.event.velocity-97 {
    filter: saturate(0.76377952755906);
}
.event.velocity-96 {
    filter: saturate(0.75590551181102);
}
.event.velocity-95 {
    filter: saturate(0.74803149606299);
}
.event.velocity-94 {
    filter: saturate(0.74015748031496);
}
.event.velocity-93 {
    filter: saturate(0.73228346456693);
}
.event.velocity-92 {
    filter: saturate(0.7244094488189);
}
.event.velocity-91 {
    filter: saturate(0.71653543307087);
}
.event.velocity-90 {
    filter: saturate(0.70866141732283);
}
.event.velocity-89 {
    filter: saturate(0.7007874015748);
}
.event.velocity-88 {
    filter: saturate(0.69291338582677);
}
.event.velocity-87 {
    filter: saturate(0.68503937007874);
}
.event.velocity-86 {
    filter: saturate(0.67716535433071);
}
.event.velocity-85 {
    filter: saturate(0.66929133858268);
}
.event.velocity-84 {
    filter: saturate(0.66141732283465);
}
.event.velocity-83 {
    filter: saturate(0.65354330708661);
}
.event.velocity-82 {
    filter: saturate(0.64566929133858);
}
.event.velocity-81 {
    filter: saturate(0.63779527559055);
}
.event.velocity-80 {
    filter: saturate(0.62992125984252);
}
.event.velocity-79 {
    filter: saturate(0.62204724409449);
}
.event.velocity-78 {
    filter: saturate(0.61417322834646);
}
.event.velocity-77 {
    filter: saturate(0.60629921259843);
}
.event.velocity-76 {
    filter: saturate(0.59842519685039);
}
.event.velocity-75 {
    filter: saturate(0.59055118110236);
}
.event.velocity-74 {
    filter: saturate(0.58267716535433);
}
.event.velocity-73 {
    filter: saturate(0.5748031496063);
}
.event.velocity-72 {
    filter: saturate(0.56692913385827);
}
.event.velocity-71 {
    filter: saturate(0.55905511811024);
}
.event.velocity-70 {
    filter: saturate(0.5511811023622);
}
.event.velocity-69 {
    filter: saturate(0.54330708661417);
}
.event.velocity-68 {
    filter: saturate(0.53543307086614);
}
.event.velocity-67 {
    filter: saturate(0.52755905511811);
}
.event.velocity-66 {
    filter: saturate(0.51968503937008);
}
.event.velocity-65 {
    filter: saturate(0.51181102362205);
}
.event.velocity-64 {
    filter: saturate(0.50393700787402);
}
.event.velocity-63 {
    filter: saturate(0.49606299212598);
}
.event.velocity-62 {
    filter: saturate(0.48818897637795);
}
.event.velocity-61 {
    filter: saturate(0.48031496062992);
}
.event.velocity-60 {
    filter: saturate(0.47244094488189);
}
.event.velocity-59 {
    filter: saturate(0.46456692913386);
}
.event.velocity-58 {
    filter: saturate(0.45669291338583);
}
.event.velocity-57 {
    filter: saturate(0.4488188976378);
}
.event.velocity-56 {
    filter: saturate(0.44094488188976);
}
.event.velocity-55 {
    filter: saturate(0.43307086614173);
}
.event.velocity-54 {
    filter: saturate(0.4251968503937);
}
.event.velocity-53 {
    filter: saturate(0.41732283464567);
}
.event.velocity-52 {
    filter: saturate(0.40944881889764);
}
.event.velocity-51 {
    filter: saturate(0.40157480314961);
}
.event.velocity-50 {
    filter: saturate(0.39370078740157);
}
.event.velocity-49 {
    filter: saturate(0.38582677165354);
}
.event.velocity-48 {
    filter: saturate(0.37795275590551);
}
.event.velocity-47 {
    filter: saturate(0.37007874015748);
}
.event.velocity-46 {
    filter: saturate(0.36220472440945);
}
.event.velocity-45 {
    filter: saturate(0.35433070866142);
}
.event.velocity-44 {
    filter: saturate(0.34645669291339);
}
.event.velocity-43 {
    filter: saturate(0.33858267716535);
}
.event.velocity-42 {
    filter: saturate(0.33070866141732);
}
.event.velocity-41 {
    filter: saturate(0.32283464566929);
}
.event.velocity-40 {
    filter: saturate(0.31496062992126);
}
.event.velocity-39 {
    filter: saturate(0.30708661417323);
}
.event.velocity-38 {
    filter: saturate(0.2992125984252);
}
.event.velocity-37 {
    filter: saturate(0.29133858267717);
}
.event.velocity-36 {
    filter: saturate(0.28346456692913);
}
.event.velocity-35 {
    filter: saturate(0.2755905511811);
}
.event.velocity-34 {
    filter: saturate(0.26771653543307);
}
.event.velocity-33 {
    filter: saturate(0.25984251968504);
}
.event.velocity-32 {
    filter: saturate(0.25196850393701);
}
.event.velocity-31 {
    filter: saturate(0.24409448818898);
}
.event.velocity-30 {
    filter: saturate(0.23622047244094);
}
.event.velocity-29 {
    filter: saturate(0.22834645669291);
}
.event.velocity-28 {
    filter: saturate(0.22047244094488);
}
.event.velocity-27 {
    filter: saturate(0.21259842519685);
}
.event.velocity-26 {
    filter: saturate(0.20472440944882);
}
.event.velocity-25 {
    filter: saturate(0.19685039370079);
}
.event.velocity-24 {
    filter: saturate(0.18897637795276);
}
.event.velocity-23 {
    filter: saturate(0.18110236220472);
}
.event.velocity-22 {
    filter: saturate(0.17322834645669);
}
.event.velocity-21 {
    filter: saturate(0.16535433070866);
}
.event.velocity-20 {
    filter: saturate(0.15748031496063);
}
.event.velocity-19 {
    filter: saturate(0.1496062992126);
}
.event.velocity-18 {
    filter: saturate(0.14173228346457);
}
.event.velocity-17 {
    filter: saturate(0.13385826771654);
}
.event.velocity-16 {
    filter: saturate(0.1259842519685);
}
.event.velocity-15 {
    filter: saturate(0.11811023622047);
}
.event.velocity-14 {
    filter: saturate(0.11023622047244);
}
.event.velocity-13 {
    filter: saturate(0.10236220472441);
}
.event.velocity-12 {
    filter: saturate(0.094488188976378);
}
.event.velocity-11 {
    filter: saturate(0.086614173228346);
}
.event.velocity-10 {
    filter: saturate(0.078740157480315);
}
.event.velocity-9 {
    filter: saturate(0.070866141732283);
}
.event.velocity-8 {
    filter: saturate(0.062992125984252);
}
.event.velocity-7 {
    filter: saturate(0.05511811023622);
}
.event.velocity-6 {
    filter: saturate(0.047244094488189);
}
.event.velocity-5 {
    filter: saturate(0.039370078740157);
}
.event.velocity-4 {
    filter: saturate(0.031496062992126);
}
.event.velocity-3 {
    filter: saturate(0.023622047244094);
}
.event.velocity-2 {
    filter: saturate(0.015748031496063);
}
.event.velocity-1 {
    filter: saturate(0.0078740157480315);
}
`;

const styleElementId = "wm-midi-debugger-styles";

/** adds the styles to the document (once) */
export function injectStyles(document: Document): void {
    if (document.getElementById(styleElementId)) {
        return;
    }
    const style = document.createElement("style");
    style.id = styleElementId;
    style.textContent = styles;
    document.head.appendChild(style);
}
