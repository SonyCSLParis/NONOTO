"use strict";
exports.__esModule = true;
// import * as nipplejs from "nipplejs";
var locator_1 = require("./locator");
var $ = require("jquery");
var MidiConvert = require("midiconvert");
var tone_piano_1 = require("tone-piano");
var Tone = require("tone");
var Tonejs_Instruments_1 = require("./tonejs-instruments/Tonejs-Instruments");
var Nexus = require("nexusui");
require("./styles/osmd.scss");
require("./styles/main.scss");
// let raphaelimport: HTMLScriptElement = document.createElement('script')
// raphaelimport.type = 'text/javascript'
// raphaelimport.src = "https://cdn.jsdelivr.net/npm/wheelnav@1.7.1/js/dist/raphael.min.js"
// document.head.appendChild(raphaelimport)
//
// let wheelimport: HTMLScriptElement = document.createElement('script')
// wheelimport.type = 'text/javascript'
// wheelimport.src = "https://cdn.jsdelivr.net/npm/wheelnav@1.7.1/js/dist/wheelnav.min.js"
// document.head.appendChild(wheelimport)
Nexus.colors.accent = '#ffb6c1'; // '#f40081';  //  light pink
Nexus.colors.fill = '#e5f5fd'; // light blue // '#f0f2ff';  // lilac triadic to '#ffb6c1'
var topControlsGridElem = document.createElement('div');
topControlsGridElem.id = 'top-controls';
document.body.appendChild(topControlsGridElem);
var playbuttonElem = document.createElement('div');
playbuttonElem.id = 'play-button';
topControlsGridElem.appendChild(playbuttonElem);
var playbutton = new Nexus.TextButton('#play-button', {
    'size': [150, 50],
    'state': false,
    'text': 'Play',
    'alternateText': 'Pause'
});
// playbutton.on('down', (e) => {playbutton.flip()}) //playCallback.bind(playbutton));
playbutton.on('change', playCallback);
var stopbuttonElem = document.createElement("div");
stopbuttonElem.id = 'stop-button';
topControlsGridElem.appendChild(stopbuttonElem);
var stopbutton = new Nexus.TextButton('#stop-button', {
    'size': [150, 50],
    'state': false,
    'text': 'Stop'
});
stopbutton.on('change', function (event) {
    playbutton.flip(false);
    Tone.Transport.stop();
    nowPlayingCallback(0, 0);
});
document.addEventListener("keydown", function (event) {
    var keyName = event.key;
    switch (keyName) {
        case 'p': {
            playbutton.down();
            break;
        }
        case 's': {
            stopbutton.down();
            stopbutton.up();
            break;
        }
    }
});
// document.body.appendChild(document.createElement("br"))
// Time-granularity selector
var granularities = ['quarter-note', 'half-note', 'whole-note'];
var granularitySelectElem = document.createElement("div");
granularitySelectElem.id = 'select-granularity';
topControlsGridElem.appendChild(granularitySelectElem);
var granularitySelect = new Nexus.Select('#select-granularity', {
    'size': [150, 50],
    'options': granularities
});
console.log(granularitySelectElem.firstElementChild.style.fontSize);
console.log(playbuttonElem.firstElementChild.firstElementChild.style.fontSize);
granularitySelectElem.firstElementChild.style.fontSize = (playbuttonElem.firstElementChild.firstElementChild.style.fontSize);
function granularityOnChange(ev) {
    $('.notebox').removeClass('active');
    $('.' + this.value + '> .notebox').addClass('active');
}
;
granularitySelect.on('change', granularityOnChange.bind(granularitySelect));
var initialGranulatity = granularities.indexOf('whole-note').toString();
granularitySelect.selectedIndex = initialGranulatity;
var titlediv = document.createElement('div');
// titlediv.classList.add('header')
titlediv.textContent = 'DeepBach';
titlediv.style.alignContent = 'CenterTop';
titlediv.style.width = '100%';
titlediv.style.fontStyle = 'bold';
titlediv.style.fontSize = '64px';
// document.body.appendChild(titlediv)
document.body.appendChild(document.createElement("div"));
// let serverUrl = 'http://0.0.0.0:5000/';
var serverUrl = 'http://10.0.1.122:5000/';
var osmd;
/*
 * Create a container element for OpenSheetMusicDisplay...
 */
var osmdContainer = document.createElement("div");
osmdContainer.classList.add('osmd-container');
/*
 * ... and attach it to our HTML document's body. The document itself is a HTML5
 * stub created by Webpack, so you won't find any actual .html sources.
 */
document.body.appendChild(osmdContainer);
/*
 * Create a new instance of OpenSheetMusicDisplay and tell it to draw inside
 * the container we've created in the steps before. The second parameter tells OSMD
 * not to redraw on resize.
 */
var useLeadsheetMode = true;
osmd = new locator_1.eOSMD(osmdContainer, true, useLeadsheetMode);
// var options = {
//     zone: osmd.renderingBackend.getInnerElement(),
//     color: "blue"
// };
// var manager = nipplejs.create(options);
// var joystick_data: {};
// var last_click = [];
//
// manager.on('start', function(event: Event, joystick) {
//     disableChanges();
// })
//
// manager.on('end', function(event: Event, joystick) {
//     // console.log(joystick_data);
//     // console.log(osmd.boundingBoxes);
//     let clickedDiv = event.target; // FIXME
//     // console.log(clickedDiv);
//     let measureIndex = findMeasureIndex(last_click);
//     // console.log(measureIndex);
//
//     let argsGenerationUrl = ("one-measure-change" +
//         ('?measureIndex=' + measureIndex)
//     );
//     let argsMidiUrl = "get-midi";
//
//     //    url += '?choraleIndex=' + choraleIndex;
//     loadMusicXMLandMidi(serverUrl + argsGenerationUrl,
//         serverUrl + argsMidiUrl);
//     enableChanges();
// }, true);
//
// manager.on('move', function(evt, joystick) {
//     joystick_data = joystick;
//     last_click = joystick.position;
// }, true);
// uncomment the following for testing
//loadMusicXMLandAudio('musicXmlSample.xml', '');
loadMusicXMLandMidi(serverUrl + 'ex', serverUrl + 'get-midi');
function removeMusicXMLHeaderNodes(xmlDocument) {
    // Strip MusicXML document of title/composer tags
    var titleNode = xmlDocument.getElementsByTagName('work-title')[0];
    var movementTitleNode = xmlDocument.getElementsByTagName('movement-title')[0];
    var composerNode = xmlDocument.getElementsByTagName('creator')[0];
    titleNode.textContent = movementTitleNode.textContent = composerNode.textContent = "";
}
function getFermatas() {
    var activeFermataElems = $('.FermataBox.active');
    var containedQuarterNotesList = [];
    for (var _i = 0, activeFermataElems_1 = activeFermataElems; _i < activeFermataElems_1.length; _i++) {
        var activeFemataElem = activeFermataElems_1[_i];
        containedQuarterNotesList.push(parseInt(activeFemataElem.parentElement.getAttribute('containedQuarterNotes')));
    }
    // const containedQuarterNotesList = activeFermataElems.map(
    //     function(){return this.parentElement.getAttribute('containedQuarterNotes');}).get()
    return containedQuarterNotesList;
}
function getChordLabels() {
    // return a stringified JSON object describing the current chords
    var chordLabels = [];
    for (var _i = 0, _a = osmd.chordSelectors; _i < _a.length; _i++) {
        var chordSelector = _a[_i];
        chordLabels.push(chordSelector.currentChord);
    }
    ;
    return chordLabels;
}
;
function getMetadata() {
    return {
        leadsheet: osmd.leadsheet,
        fermatas: getFermatas(),
        chordLabels: getChordLabels()
    };
}
function onClickTimestampBoxFactory(timeStart, timeEnd) {
    var _a = ([timeStart, timeEnd].map(function (timeFrac) { return Math.round(16 * timeFrac.RealValue); })), sixteenthnoteStart = _a[0], sixteenthnoteEnd = _a[1];
    var argsGenerationUrl = (UrlTimerangeChange +
        ("?sixteenthnoteStart=" + sixteenthnoteStart) +
        ("&sixteenthnoteEnd=" + sixteenthnoteEnd));
    var argsMidiUrl = "get-midi";
    return (function (event) {
        // this.style.opacity = '0.3';
        // console.log(getChordLabels());
        // const fermatasString = getFermatas()
        var argsGenerationUrlWithFermatas = (argsGenerationUrl); // +
        // '&fermatas=' + fermatasString)
        loadMusicXMLandMidi(serverUrl + argsGenerationUrlWithFermatas, serverUrl + argsMidiUrl);
        ;
    });
}
function blockall(e) {
    // block propagation of events in bubbling/capturing
    e.stopPropagation();
    e.preventDefault();
}
function toggleBusyClass(toggleBusy) {
    var noteboxes = $('.notebox');
    if (toggleBusy) {
        noteboxes.addClass('busy');
        noteboxes.removeClass('available');
    }
    else {
        noteboxes.removeClass('busy');
        noteboxes.addClass('available');
    }
}
function disableChanges() {
    toggleBusyClass(true);
    $('.timecontainer').addClass('busy');
    $('.notebox').each(function () {
        this.addEventListener("click", blockall, true);
    });
}
function enableChanges() {
    $('.notebox').each(function () {
        this.removeEventListener("click", blockall, true);
    });
    $('.timecontainer').removeClass('busy');
    toggleBusyClass(false);
}
/**
 * Load a MusicXml file via xhttp request, and display its contents.
 */
function loadMusicXMLandMidi(urlXML, urlMidi) {
    disableChanges();
    console.log(JSON.stringify(getMetadata()));
    $.post({
        url: urlXML,
        data: JSON.stringify(getMetadata()),
        contentType: 'application/json',
        dataType: 'xml',
        success: function (xmldata) {
            removeMusicXMLHeaderNodes(xmldata);
            osmd.load(xmldata)
                .then(function () {
                osmd.render(onClickTimestampBoxFactory);
                enableChanges();
            }, function (err) { console.log(err); enableChanges(); });
            loadMidi(urlMidi);
            // loadMidiToPiano(urlMidi);
        }
    });
}
;
var piano = new tone_piano_1.Piano([21, 108], 5);
// var samples = SampleLibrary.load({
//             instruments: ['organ'],
//             baseUrl: "tonejs-instruments/samples/"
//         })
// var organ = samples['organ']
// organ.release = 1.8
// organ.toMaster();
var chorus = new Tone.Chorus(2, 1.5, 0.5).toMaster();
var reverb = new Tone.Reverb(1.5).connect(chorus);
reverb.generate();
var polysynth = new Tone.PolySynth(12);
polysynth.connect(reverb);
var steelpan = new Tone.PolySynth(12).set({
    "oscillator": {
        "type": "fatcustom",
        "partials": [0.2, 1, 0, 0.5, 0.1],
        "spread": 40,
        "count": 3
    },
    "envelope": {
        "attack": 0.001,
        "decay": 1.6,
        "sustain": 0,
        "release": 1.6
    }
});
steelpan.connect(reverb);
// piano.load().then(()=>{
// 	//make the button active on load
// 	// let button = document.querySelector('button')
// 	// button.classList.add('active')
// 	// document.querySelector('#loading').remove()
// })
// Manual samples loading button, to reduce network usage
var loadSamplesButtonElem = document.createElement('div');
loadSamplesButtonElem.id = 'load-samples-button';
document.body.appendChild(loadSamplesButtonElem);
var loadSamplesButton = new Nexus.TextButton('#load-samples-button', {
    'size': [150, 50],
    'state': false,
    'text': 'Load samples',
    'alternateText': 'Samples loading'
});
var samples, organ; // declare variables but do not load samples yet
loadSamplesButton.on('change', function () {
    // must disable pointer events on *child* node to also use cursor property
    loadSamplesButtonElem.firstElementChild.style.pointerEvents = 'none';
    loadSamplesButtonElem.style.cursor = 'wait';
    var loadPromises = [];
    var sampleLibraryLoadPromise = new Promise(function (resolve, reject) {
        samples = Tonejs_Instruments_1.SampleLibrary.load({
            instruments: ['organ'],
            baseUrl: "tonejs-instruments/samples/"
        });
        organ = samples['organ'];
        addSilentPianoMethods_(organ);
        organ.release = 1.8;
        organ.toMaster();
        resolve(organ);
    });
    loadPromises.push(sampleLibraryLoadPromise);
    var pianoLoadPromise = piano.load();
    loadPromises.push(pianoLoadPromise);
    Promise.all(loadPromises).then(function () {
        console.log('Finished downloading!');
        loadSamplesButtonElem.remove();
        instrumentSelect.render();
    });
});
console.log('(Something here)');
// playbutton.on('change', playCallback)
function addSilentPianoMethods_(instrument) {
    // add dummy Piano methods for simple duck typing
    instrument.keyDown = function () { return instrument; };
    instrument.keyUp = function () { return instrument; };
    instrument.pedalDown = function () { return instrument; };
    instrument.pedalUp = function () { return instrument; };
    instrument.pedalDown = function () { return instrument; };
    return instrument;
}
function addTriggerAttackRelease_(piano) {
    // add dummy Instrument method for simple duck typing
    piano.triggerAttackRelease = function () { return piano; };
    return piano;
}
var instruments = [polysynth, steelpan];
for (var _i = 0, instruments_1 = instruments; _i < instruments_1.length; _i++) {
    var instrument = instruments_1[_i];
    addSilentPianoMethods_(instrument);
}
addTriggerAttackRelease_(piano);
var instrumentFactories = {
    'PolySynth': function () { return polysynth; },
    'Sampled Piano': function () {
        piano.disconnect(0);
        piano.toMaster();
        return piano;
    },
    'Sampled Piano (w/ reverb)': function () { piano.disconnect(0); piano.connect(reverb); return piano; },
    'Organ': function () { return organ; },
    'Steelpan': function () { return steelpan; }
};
var instrumentSelectElem = document.createElement('div');
instrumentSelectElem.id = 'instrument-select';
document.body.appendChild(instrumentSelectElem);
var instrumentSelect = new Nexus.Select('#instrument-select', {
    'size': [275, 40],
    'options': Object.keys(instrumentFactories)
});
var current_instrument = polysynth;
function instrumentOnChange() {
    current_instrument = instrumentFactories[this.value]();
}
;
instrumentSelect.on('change', instrumentOnChange.bind(instrumentSelect));
var initialInstrument = 'PolySynth';
instrumentSelect.value = initialInstrument;
// Create BPM slider
var bpmContainerElem = document.createElement('div');
bpmContainerElem.setAttribute('horizontal', '');
bpmContainerElem.setAttribute('layout', '');
bpmContainerElem.setAttribute('display', 'grid');
bpmContainerElem.setAttribute('grid-template-columns', '200px 200px;');
document.body.appendChild(bpmContainerElem);
var bpmSliderElem = document.createElement('div');
bpmSliderElem.setAttribute('id', 'bpm-slider');
bpmContainerElem.appendChild(bpmSliderElem);
var bpmCounterElem = document.createElement('div');
bpmCounterElem.setAttribute('id', 'bpm-counter');
bpmCounterElem.style.pointerEvents = 'none';
bpmContainerElem.appendChild(bpmCounterElem);
var bpmSlider = new Nexus.Slider('#bpm-slider', {
    'size': [200, 40],
    'min': 80,
    'max': 130,
    'step': 1
});
var bpmCounter = new Nexus.Number('#bpm-counter', {
    'min': 80,
    'max': 130,
    'step': 1
});
bpmSlider.on('change', function (value) {
    Tone.Transport.bpm.value = value;
});
bpmCounter.link(bpmSlider);
bpmSlider.value = 110;
// function playNotePiano(time, event){
//     current_instrument.keyDown(event.note, event.velocity, time)
//                       .keyUp(event.note, time + event.duration)
// }
function playNote(time, event) {
    current_instrument.triggerAttackRelease(event.name, event.duration, time, event.velocity);
    current_instrument.keyDown(event.note, event.velocity, time).keyUp(event.note, time + event.duration);
}
function nowPlayingCallback(time, step) {
    $('.notebox').removeClass('playing');
    $(".timecontainer[containedQuarterNotes~='" + step + "'] .notebox").addClass('playing');
}
// quarter-note aligned steps
var sequence_duration_tone = Tone.Time('4m'); // FIXME hardcoded piece duration
// FIXME could break, should really parse tone js duration
var _a = sequence_duration_tone.toBarsBeatsSixteenths().split(':').map(parseFloat), seq_dur_measures = _a[0], seq_dur_quarters = _a[1], seq_dur_sixteenths = _a[2];
var sequence_duration_quarters = Math.floor((4 * seq_dur_measures +
    seq_dur_quarters + Math.floor(seq_dur_sixteenths / 4)));
var steps = [];
for (var i = 0; i < sequence_duration_quarters; i++) {
    steps.push(i);
}
function loadMidi(url) {
    MidiConvert.load(url, function (midi) {
        Tone.Transport.cancel(); // remove all scheduled events
        // must set the Transport BPM to that of the midi for proper scheduling
        Tone.Transport.bpm.value = midi.header.bpm;
        Tone.Transport.timeSignature = midi.header.timeSignature;
        // schedule quarter-notes clock
        new Tone.Sequence(nowPlayingCallback, steps, '4n').start(0);
        for (var _i = 0, _a = midi.tracks; _i < _a.length; _i++) {
            var track = _a[_i];
            var notes = track.notes;
            var part = new Tone.Part(playNote, notes);
            part.start(0); // schedule events on the Tone timeline
            part.loop = true;
            part.loopEnd = sequence_duration_tone;
        }
        for (var _b = 0, _c = midi.tracks; _b < _c.length; _b++) {
            var track = _c[_b];
            //schedule the pedal
            var sustain = new Tone.Part(function (time, event) {
                if (event.value) {
                    current_instrument.pedalDown(time);
                }
                else {
                    current_instrument.pedalUp(time);
                }
            }, track.controlChanges[64]).start(0);
            var noteOffEvents = new Tone.Part(function (time, event) {
                current_instrument.keyUp(event.midi, time, event.velocity);
            }, track.noteOffs).start(0);
            var noteOnEvents = new Tone.Part(function (time, event) {
                current_instrument.keyDown(event.midi, time, event.velocity);
            }, track.notes).start(0);
            for (var _d = 0, _e = [sustain, noteOffEvents, noteOnEvents]; _d < _e.length; _d++) {
                var part = _e[_d];
                part.loop = true;
                part.loopEnd = sequence_duration_tone;
            }
        }
        // change Transport BPM back to the displayed value
        Tone.Transport.bpm.value = bpmSlider.value;
    });
}
function loadMidiToPiano(url) {
    MidiConvert.load(url).then(function (midi) {
        // Tone.Transport.cancel()  // remove all scheduled events
        //
        // Tone.Transport.bpm.value = midi.header.bpm
        // Tone.Transport.timeSignature = midi.header.timeSignature
        //
        // // schedule quarter-notes clock
        // new Tone.Sequence(nowPlayingCallback, steps, '4n').start(0);
        for (var _i = 0, _a = midi.tracks; _i < _a.length; _i++) {
            var track = _a[_i];
            //schedule the pedal
            var sustain = new Tone.Part(function (time, event) {
                if (event.value) {
                    piano.pedalDown(time);
                }
                else {
                    piano.pedalUp(time);
                }
            }, track.controlChanges[64]).start(0);
            var noteOffEvents = new Tone.Part(function (time, event) {
                piano.keyUp(event.midi, time, event.velocity);
            }, track.noteOffs).start(0);
            var noteOnEvents = new Tone.Part(function (time, event) {
                piano.keyDown(event.midi, time, event.velocity);
            }, track.notes).start(0);
            for (var _b = 0, _c = [sustain, noteOffEvents, noteOnEvents]; _b < _c.length; _b++) {
                var part = _c[_b];
                part.loop = true;
                part.loopEnd = sequence_duration_tone;
            }
        }
    });
}
function playCallback() {
    // playbutton.flip()
    Tone.context.resume().then(function () {
        if (playbutton.state) { //Tone.Transport.state === "started"){
            Tone.Transport.start("+0.1");
            // this.turnOn()
        }
        else {
            Tone.Transport.pause();
            // this.turnOff();
            // this.textContent = "PAUSE";
        }
    });
}
;
