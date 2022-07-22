# Werckmeister

This extension provides support for the [Werckmeister](https://werckme.github.io) sheet music compiler.


## Features

* MIDI Playback from source
* Playback visualization
* Werckmeister-VST Plugin integration
* MIDI Inspector
* Syntax highlighting
* Autocompletion


### Werckmeister-VST Plugin integration
Connect a Werckmeister-VST instance with VSCode
<img src="https://raw.githubusercontent.com/werckme/werckmeister/manual-update/assets/vst2vscode.gif">

### MIDI Inspector
Analyse the compiled MIDI file of a sheet. 

### Piano Roll View
<img src="https://raw.githubusercontent.com/werckme/werckmeister-codext/master/assets/features/werckmeister-inspector-piano-roll.gif">

### Event List View
<img src="https://raw.githubusercontent.com/werckme/werckmeister-codext/master/assets/features/werckmeister-inspector.gif">

### MIDI Inspector - Track Filter
<img src="https://raw.githubusercontent.com/werckme/werckmeister-codext/master/assets/features/werckmeister-inspector-filter.gif">

### MIDI Inspector - Transport Controller
<img src="https://raw.githubusercontent.com/werckme/werckmeister-codext/master/assets/features/werckmeister-inspector-transport.gif">

### Playback visualization
<img src="https://raw.githubusercontent.com/werckme/werckmeister-codext/master/assets/features/playbackvis.gif">

### Start playback at random position
<img src="https://raw.githubusercontent.com/werckme/werckmeister-codext/master/assets/features/startfrompos.gif">


## Prerequisites

* [Werckmeister](https://werckme.github.io) Version >= 0.1.53 installed

## Installation

You need an installed Werckmeister compiler on your machine.

With that Werckmeister installation, the Werckmeister compiler should be accessable system wide. So normally you have to do nothing.
If Visual Studio Code is not able to execute the Werckmeister compiler you are able set the installation path via the extension setup:

*Preferences -> Settings -> Extensions -> Werckmeister Binary Directory*

<img src="https://raw.githubusercontent.com/werckme/werckmeister-codext/master/assets/pathsetup.png">
