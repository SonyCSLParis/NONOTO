// import * as nipplejs from "nipplejs";
import { eOSMD } from "./locator";
import { Fraction } from 'opensheetmusicdisplay'
import * as $ from "jquery";
import * as WebMidi from 'webmidi'
import * as MidiConvert from "midiconvert";
import {Piano} from 'tone-piano';
import * as Tone from "tone";
import { SampleLibrary, set_samples } from './tonejs-instruments/Tonejs-Instruments'
import * as Nexus from 'nexusui'
import {ChordSelector} from './chord_selector';
import {make_voices_lockets} from './unlock_voices'
import { createWavInput } from './file_upload';
import {Initialize_record} from './record_audio';
import {Initialize_canvas, send_callback} from './drawing_stave'

import './styles/osmd.scss'
import './styles/main.scss'

let server_config = require('./config.json');


// add Piano methods to Tone.Insutrument objects for duck typing
Tone.Instrument.prototype.keyDown = function() {return this};
Tone.Instrument.prototype.keyUp = function() {return this};
Tone.Instrument.prototype.pedalDown = function() {return this};
Tone.Instrument.prototype.pedalUp = function() {return this};

// let raphaelimport: HTMLScriptElement = document.createElement('script')
// raphaelimport.type = 'text/javascript'
// raphaelimport.src = "https://cdn.jsdelivr.net/npm/wheelnav@1.7.1/js/dist/raphael.min.js"
// document.head.appendChild(raphaelimport)
//
// let wheelimport: HTMLScriptElement = document.createElement('script')
// wheelimport.type = 'text/javascript'
// wheelimport.src = "https://cdn.jsdelivr.net/npm/wheelnav@1.7.1/js/dist/wheelnav.min.js"
// document.head.appendChild(wheelimport)

document.body.style.marginBottom = '15px';
let number_loaded_chorales = 1; // Number of different chorales loaded (used to remove previous boxes)
let new_chorale = false
Nexus.colors.accent = '#ffb6c1';  // '#f40081';  //  light pink
Nexus.colors.fill = '#e5f5fd';  // light blue // '#f0f2ff';  // lilac triadic to '#ffb6c1'

let topControlsGridElem: HTMLDivElement = document.createElement('div')
topControlsGridElem.id = 'top-controls'
document.body.appendChild(topControlsGridElem);

let playbuttonElem: HTMLElement = document.createElement('div');
playbuttonElem.id = 'play-button'
topControlsGridElem.appendChild(playbuttonElem);

let playbutton = new Nexus.TextButton('#play-button',{
    'size': [150,50],
    'state': false,
    'text': 'Play',
    'alternateText': 'Pause'
})
// playbutton.on('down', (e) => {playbutton.flip()}) //playCallback.bind(playbutton));
playbutton.on('change', playCallback)


let stopbuttonElem: HTMLElement = document.createElement("div");
stopbuttonElem.id = 'stop-button';
topControlsGridElem.appendChild(stopbuttonElem);

let stopbutton = new Nexus.TextButton('#stop-button',{
    'size': [150,50],
    'state': false,
    'text': 'Stop'
})
stopbutton.on('change', (event) => {
    playbutton.flip(false);
    Tone.Transport.stop();
    nowPlayingCallback(0, 0);
});

document.addEventListener("keydown", (event) => {
    const keyName = event.key
    switch (keyName) {
        case 'p': {playbutton.down(); break}
        case 's': {stopbutton.down(); stopbutton.up(); break}
    }});

// document.body.appendChild(document.createElement("br"))

// Time-granularity selector
let granularities = ['quarter-note', 'half-note', 'whole-note']

let granularitySelectElem: HTMLElement = document.createElement("div");
granularitySelectElem.id = 'select-granularity'
topControlsGridElem.appendChild(granularitySelectElem)

let granularitySelect = new Nexus.Select('#select-granularity', {
    'size': [150, 50],
    'options': granularities,
});
(granularitySelectElem.firstElementChild as HTMLElement).style.fontSize = (
    (playbuttonElem.firstElementChild.firstElementChild as HTMLElement).style.fontSize);
function granularityOnChange(ev) {
    $('.notebox').removeClass('active');
    $('.' + this.value + '> .notebox').addClass('active');
};
granularitySelect.on('change', granularityOnChange.bind(granularitySelect))
const initialGranulatity = granularities.indexOf('whole-note').toString()
granularitySelect.selectedIndex = initialGranulatity



let titlediv: HTMLDivElement = document.createElement('div')
// titlediv.classList.add('header')
titlediv.style.position = 'relative'
titlediv.style.top = '90px'
titlediv.textContent = 'DeepBach'
titlediv.style.textAlign = 'center'
titlediv.style.width = '100%'
titlediv.style.fontStyle = 'bold'
titlediv.style.fontSize = '90px'
document.body.appendChild(titlediv);
// document.body.appendChild(document.createElement("div"))

let useLeadsheetMode = false;  // true for leadsheets, false for chorales
let serverPort: number
if (useLeadsheetMode) {
    serverPort = server_config['leadsheet_port']
} else {
    serverPort = server_config['chorale_port']
}
let serverUrl = 'http://localhost:5001/'

// let urlMidi = serverUrl + 'get-midi'
// let serverUrl = `http://${server_config['server_ip']}:${serverPort}/`;
let osmd: eOSMD;
/*
 * Create a container element for OpenSheetMusicDisplay...
 */
let osmdContainer: HTMLElement = (
    <HTMLElement>document.createElement("div"));
osmdContainer.classList.add('osmd-container')
/*
 * ... and attach it to our HTML document's body. The document itself is a HTML5
 * stub created by Webpack, so you won't find any actual .html sources.
 */
osmdContainer.style.position = 'relative'
osmdContainer.style.top = '-10px'
osmdContainer.style.margin = '150px 0 0 75px'
document.body.appendChild(osmdContainer);
/*
 * Create a new instance of OpenSheetMusicDisplay and tell it to draw inside
 * the container we've created in the steps before. The second parameter tells OSMD
 * not to redraw on resize.
 */
osmd = new eOSMD(osmdContainer, true, useLeadsheetMode);
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
// //loadMusicXMLandAudio('musicXmlSample.xml', '');

make_voices_lockets();
import{UrlTimerangeChange} from './unlock_voices';
loadMusicXMLandMidi(serverUrl + 'ex', serverUrl + 'get-midi');

function removeMusicXMLHeaderNodes(xmlDocument: XMLDocument): void{
    // Strip MusicXML document of title/composer tags
    let titleNode = xmlDocument.getElementsByTagName('work-title')[0]
    let movementTitleNode = xmlDocument.getElementsByTagName('movement-title')[0]
    let composerNode = xmlDocument.getElementsByTagName('creator')[0]

    titleNode.textContent = movementTitleNode.textContent = composerNode.textContent = ""
}

function getFermatas(): number[] {
    const activeFermataElems = $('.FermataBox.active')
    let containedQuarterNotesList = [];
    for (let activeFemataElem of activeFermataElems) {
        containedQuarterNotesList.push(parseInt(
            activeFemataElem.parentElement.getAttribute('containedQuarterNotes')))
    }
    // const containedQuarterNotesList = activeFermataElems.map(
    //     function(){return this.parentElement.getAttribute('containedQuarterNotes');}).get()
    return containedQuarterNotesList;
}

function getChordLabels(): object[] {
    // return a stringified JSON object describing the current chords
    let chordLabels = [];
    for (let chordSelector of osmd.chordSelectors) {
        chordLabels.push(chordSelector.currentChord)
    };
    return chordLabels;
};

function getMetadata() {
    return {
        leadsheet: osmd.leadsheet,
        fermatas: getFermatas(),
        chordLabels: getChordLabels()
    }
}
export{getMetadata};

function onClickTimestampBoxFactory(timeStart: Fraction, timeEnd: Fraction) {
    const  [quarternoteStart, quarternoteEnd] = ([timeStart, timeEnd].map(
        timeFrac => Math.round(4 * timeFrac.RealValue)))
    return (function (this, event) {
      if (constrainDrawing.state) {
        send_callback(quarternoteStart, quarternoteEnd);
      }
      else{
        var argsGenerationUrl = `&quarterNoteStart=${quarternoteStart}` +
            `&quarterNoteEnd=${quarternoteEnd}`;
        const argsMidiUrl = "get-midi";
        console.log(UrlTimerangeChange)
          loadMusicXMLandMidi(serverUrl + UrlTimerangeChange + argsGenerationUrl,
            serverUrl + argsMidiUrl);
      }

    })
}

function blockall(e) {
    // block propagation of events in bubbling/capturing
    e.stopPropagation();
    e.preventDefault();}

function toggleBusyClass(toggleBusy: boolean): void{
    let noteboxes = $('.notebox')
    if (toggleBusy) {
        noteboxes.addClass('busy');
        noteboxes.removeClass('available');
    }
    else {
        noteboxes.removeClass('busy');
        noteboxes.addClass('available');
    }
}

function disableChanges(): void {
    toggleBusyClass(true);
    $('.timecontainer').addClass('busy');
    $('.notebox').each(function() {
        this.addEventListener("click", blockall, true);}
    )
}

function enableChanges(): void {
    $('.notebox').each(function() {
        this.removeEventListener("click", blockall, true);}
    )
    $('.timecontainer').removeClass('busy');
    toggleBusyClass(false);
}

function loadMusicXMLandMidi_callback (xmldata: XMLDocument, urlMidi: string) {
    removeMusicXMLHeaderNodes(xmldata);
    osmd.load(xmldata)
        .then(
            () => {
                  console.log(new_chorale);
                  if (new_chorale){
                    $('.timecontainer').remove()
                  }
                  osmd.render(onClickTimestampBoxFactory);
                  new_chorale = false;
                  set_tone_time_parameters();
                  enableChanges();
                  loadMidi(urlMidi);
                  },
            (err) => {console.log(err); enableChanges();}
        );

    // loadMidiToPiano(urlMidi);
}

/**
 * Load a MusicXml file via xhttp request, and display its contents.
 */

function loadMusicXMLandMidi(urlXML: string, urlMidi: string) {
    disableChanges();
    console.log(JSON.stringify(getMetadata()));
    $.post({
        url: urlXML,
        data: JSON.stringify(getMetadata()),
        contentType: 'application/json',
        dataType: 'xml',
        success: ((xmldata : XMLDocument) => {loadMusicXMLandMidi_callback(xmldata, urlMidi)}),
            // loadMidiToPiano(urlMidi);
    });
};


var piano = new Piano([21, 108], 5);

var chorus = new Tone.Chorus(2, 1.5, 0.5).toMaster();
var reverb = new Tone.Reverb(1.5).connect(chorus);
reverb.generate();

var polysynth = new Tone.PolySynth(12);
polysynth.connect(reverb)

var polysynth_chords = new Tone.PolySynth(24);
polysynth_chords.connect(reverb)

let steelpan = new Tone.PolySynth(12).set({
    "oscillator": {
        "type": "fatcustom",
        "partials" : [0.2, 1, 0, 0.5, 0.1],
        "spread" : 40,
        "count" : 3},
    "envelope": {
        "attack": 0.001,
        "decay": 1.6,
        "sustain": 0,
        "release": 1.6}
    }
);
steelpan.connect(reverb);

export var voice_samples = {}

// Manual samples loading button, to reduce network usage
let loadSamplesButtonElem: HTMLDivElement = document.createElement('div')
loadSamplesButtonElem.id = 'load-samples-button'
document.body.appendChild(loadSamplesButtonElem)

let loadSamplesButton = new Nexus.TextButton('#load-samples-button',{
    'size': [150,50],
    'state': false,
    'text': 'Load samples',
    'alternateText': 'Samples loading'
})

loadSamplesButton.textElement.style.fontSize = '15px';
let sampledInstruments = {};  // declare variables but do not load samples yet
let sampled_instruments_names = ['organ', 'harmonium', 'xylophone'];
let sampled_instruments_url = "tonejs-instruments/samples/"

function loadSamplesCallback () {
  // must disable pointer events on *child* node to also use cursor property
  (loadSamplesButtonElem.firstElementChild as HTMLElement).style.pointerEvents = 'none';
  loadSamplesButtonElem.style.cursor = 'wait';
  let loadPromises: Promise<any>[] = []
  let sampleLibraryLoadPromise = new Promise((resolve, reject) => {
      sampledInstruments = SampleLibrary.load({
                  instruments: sampled_instruments_names,
                  baseUrl: sampled_instruments_url
              });
      Object.keys(sampledInstruments).forEach(function(instrument_name) {
          sampledInstruments[instrument_name].release = 1.8;
          sampledInstruments[instrument_name].toMaster();
      });
      resolve(sampledInstruments);
  });
  loadPromises.push(sampleLibraryLoadPromise)
  // Don't load piano samples 2 times : 'organ' is always load with piano
  let pianoLoadPromise: Promise<boolean> = piano.load()
  loadPromises.push(pianoLoadPromise)

  Promise.all(loadPromises).then(()=>{
      (loadSamplesButtonElem.firstElementChild as HTMLElement).style.pointerEvents = 'auto';
      loadSamplesButton.turnOff();
      loadSamplesButtonElem.style.cursor = 'auto';
      loadSamplesButtonElem.classList.add('hide');
      console.log('Finished downloading!');
      // loadSamplesButtonElem.remove();
      instrumentSelect.render();
  });
}

loadSamplesButton.on('change', () => {
  if (loadSamplesButton.state) {
  loadSamplesCallback();
  }
 });

function addTriggerAttackRelease_(piano: Piano) {
    // add dummy Instrument method for simple duck typing
    piano.triggerAttackRelease = () => {return piano};
    return piano;
}
addTriggerAttackRelease_(piano);

let instrumentFactories = {
    'PolySynth': () => {return polysynth},
    'Sampled Piano': () => {
        piano.disconnect(0); piano.toMaster(); return piano},
    'Sampled Piano (w/ reverb)':
        () => {piano.disconnect(0); piano.connect(reverb); return piano},
    'Xylophone': () => {return sampledInstruments['xylophone']},
    'Steelpan': () => {return steelpan},
    'Voice': () => {return sampledInstruments['voice']}
}

let instrumentSelectElem: HTMLElement = document.createElement('div')
instrumentSelectElem.id = 'instrument-select'
document.body.appendChild(instrumentSelectElem)

let instrumentSelect = new Nexus.Select('#instrument-select', {
    'size': [275, 40],
    'options': Object.keys(instrumentFactories)
})

let current_instrument = polysynth;
function instrumentOnChange() {
    current_instrument = instrumentFactories[this.value]();
};

instrumentSelect.on('change', instrumentOnChange.bind(instrumentSelect))
const initialInstrument = 'PolySynth'
instrumentSelect.value = initialInstrument

let chordInstrumentSelectElem: HTMLDivElement;
let chordInstrumentFactories;
let chordInstrumentSelect;
let chords_instrument;
const initialChordInstrument = 'PolySynth';
if (osmd.leadsheet) {
    // addSilentPianoMethods_(polysynth_chords);

    // create second instrument selector for chord instrument
    chordInstrumentSelectElem = document.createElement('div')
    chordInstrumentSelectElem.id = 'chord-instrument-select'
    document.body.appendChild(chordInstrumentSelectElem)

    chordInstrumentFactories = {
        'PolySynth': () => {return polysynth_chords},
        'Organ': () => {return sampledInstruments['organ']},
        'Harmonium': () => {return sampledInstruments['harmonium']},
    }

    chordInstrumentSelect = new Nexus.Select('#chord-instrument-select', {
        'size': [275, 40],
        'options': Object.keys(chordInstrumentFactories)
    })

    chords_instrument = polysynth_chords;
    function chordInstrumentOnChange() {
        chords_instrument = chordInstrumentFactories[this.value]();
    };

    chordInstrumentSelect.on('change', chordInstrumentOnChange.bind(chordInstrumentSelect))
    chordInstrumentSelect.value = initialChordInstrument
}

// Create BPM slider
let bpmContainerElem: HTMLDivElement = document.createElement('div');
bpmContainerElem.setAttribute('horizontal', '');
bpmContainerElem.setAttribute('layout', '');
bpmContainerElem.setAttribute('display', 'grid');
bpmContainerElem.setAttribute('grid-template-columns', '200px 200px;');

document.body.appendChild(bpmContainerElem);

let bpmSliderElem: HTMLElement = document.createElement('div');
bpmSliderElem.setAttribute('id', 'bpm-slider');
bpmContainerElem.appendChild(bpmSliderElem);
let bpmCounterElem: HTMLElement = document.createElement('div');
bpmCounterElem.setAttribute('id', 'bpm-counter');
bpmCounterElem.style.pointerEvents = 'none';
bpmContainerElem.appendChild(bpmCounterElem);

let bpmSlider = new Nexus.Slider('#bpm-slider', {
    'size':[200, 40],
    'min': 80,
    'max': 130,
    'step': 1
});
let bpmCounter = new Nexus.Number('#bpm-counter', {
    'min': 80,
    'max': 130,
    'step': 1
});

bpmSlider.on('change', function(value){
    Tone.Transport.bpm.value = value;
});
bpmCounter.link(bpmSlider);

bpmSlider.value = 110

let midiOutput = WebMidi.outputs[0];  // declare midiOut stub variable


function playNote(time, event){
    let timingOffset = performance.now() - Tone.now() * 1000
    current_instrument.triggerAttackRelease(event.name, event.duration, time,
        event.velocity);

    // console.log(time)
    // console.log(time * 1000 + timingOffset)
    // console.log(event.name)
    WebMidi.enable(function() { midiOutput.playNote(event.name, 1,
        {time: time * 1000 + timingOffset,
         duration: event.duration * 1000}) });
}

function playNoteChordsInstrument(time, event){
    chords_instrument.triggerAttackRelease(event.name, event.duration, time,
        event.velocity);
}

function nowPlayingCallback(time, step){
    $('.notebox').removeClass('playing');
    $(`.timecontainer[containedQuarterNotes~='${step}'] .notebox`).addClass('playing');
}

// quarter-note aligned steps
let sequence_duration_tone: Tone.Time;
let [seq_dur_measures, seq_dur_quarters, seq_dur_sixteenths] = [0, 0, 0];
let sequence_duration_quarters = 0
let steps = [];
let seq_duration = 0;

function set_tone_time_parameters() {
    steps = []
    seq_duration = osmd.sequenceDuration();
    sequence_duration_tone = Tone.Time(`${seq_duration / 4}m`)
    // if (osmd.leadsheet) {sequence_duration_tone = Tone.Time('8m')}  // FIXME hardcoded piece duration
    // else {sequence_duration_tone = Tone.Time('4m')}
    // FIXME could break, should really parse tone js duration
    let [seq_dur_measures, seq_dur_quarters, seq_dur_sixteenths] =
        sequence_duration_tone.toBarsBeatsSixteenths().split(':').map(parseFloat)
    sequence_duration_quarters = Math.floor((4*seq_dur_measures +
        seq_dur_quarters + Math.floor(seq_dur_sixteenths / 4)))
    for (let i = 0; i < sequence_duration_quarters; i++) {
        steps.push(i);
    }
}

function scheduleTrackToInstrument(midiTrack, isChords=false) {
    let notes = midiTrack.notes;
    let playNote_callback;
    let getInstrument;

    if (isChords) {
        getInstrument = () => chords_instrument;
        playNote_callback = playNoteChordsInstrument}
    else {
        getInstrument = () => current_instrument;
        playNote_callback = playNote}
    let part = new Tone.Part(playNote_callback, notes);
    part.start(0)  // schedule events on the Tone timeline
    part.loop = true;
    part.loopEnd = sequence_duration_tone;

    //schedule the pedal
    // FIXME MAYBE possible bug with binding of the instruùment variable
    let sustain = new Tone.Part((time, event) => {
        if (event.value){
            getInstrument().pedalDown(time)
        } else {
            getInstrument().pedalUp(time)
        }
    }, midiTrack.controlChanges[64]).start(0)

    let noteOffEvents = new Tone.Part((time, event) => {
        getInstrument().keyUp(event.midi, time, event.velocity)
    }, midiTrack.noteOffs).start(0)

    let noteOnEvents = new Tone.Part((time, event) => {
        getInstrument().keyDown(event.midi, time, event.velocity)
    }, midiTrack.notes).start(0)

    console.log(midiTrack.noteOffs)
    console.log(midiTrack.notes)

    for (let part of [sustain, noteOffEvents, noteOnEvents]) {
        part.loop = true;
        part.loopEnd = sequence_duration_tone;
        console.log(part)
    }
}

export function loadMidi(url: string, draw_boxes=true) {
    MidiConvert.load(url, function(midi) {
        Tone.Transport.cancel()  // remove all scheduled events

        // must set the Transport BPM to that of the midi for proper scheduling
        if (midi) {
            Tone.Transport.bpm.value = midi.header.bpm;
            Tone.Transport.timeSignature = midi.header.timeSignature;

            if (draw_boxes){
              let drawCallback = (time, step) => {
                      // DOM modifying callback should be put in Tone.Draw scheduler!
                      // see: https://github.com/Tonejs/Tone.js/wiki/Performance#syncing-visuals
                      Tone.Draw.schedule((time) => {nowPlayingCallback(time, step)}, time);
                      }

              // schedule quarter-notes clock
              new Tone.Sequence(drawCallback, steps, '4n').start(0);
            }

            if (!osmd.leadsheet) {
                for (let track of midi.tracks) {
                    scheduleTrackToInstrument(track);
                }
            }
            else {
                scheduleTrackToInstrument(midi.tracks[0]);
                scheduleTrackToInstrument(midi.tracks[1], true);
            }

            // change Transport BPM back to the displayed value
            Tone.Transport.bpm.value = bpmSlider.value;
      }
    })
}

function playCallback(){
    Tone.context.resume().then(() => {
        if (playbutton.state) {//Tone.Transport.state === "started"){
            Tone.Transport.start("+0.2");
            // this.turnOn()
        } else {
            Tone.Transport.pause();
            // this.turnOff();
            // this.textContent = "PAUSE";
        }
    })
};

let dummyMidiOut = new Tone.Instrument()
dummyMidiOut.playNote = () => {};

let midiOutSelectElem: HTMLElement = document.createElement("div");
midiOutSelectElem.id = 'select-midiout';
document.body.appendChild(midiOutSelectElem);
WebMidi.enable(function (err) {
    if (err) console.log(err);

    let midiOutSelect = new Nexus.Select('#select-midiout', {
        'size': [150, 50],
        'options': ['No Output'].concat(WebMidi.outputs.map((output) => output.name)),
    });
    function midiOutOnChange(ev) {
        console.log(ev);
        if (this.value !== 'No Output') {
                midiOutput = WebMidi.getOutputByName(this.value);
        }
        else {
                midiOutput = dummyMidiOut;
        }
        console.log(midiOutput)
    };
    midiOutSelect.on('change', midiOutOnChange.bind(midiOutSelect));
});

let urlLoadfile = serverUrl + 'load-audio-file';

function load_chorale(xmldata : XMLDocument, isNew: boolean) {
      new_chorale = isNew;
      loadMusicXMLandMidi_callback(xmldata, serverUrl + 'get-midi');
      if (isNew){
        playbutton.flip(false);
        make_voices_lockets(true);
        Tone.Transport.stop();
        nowPlayingCallback(0, 0);
        }
      }

function compute_chorale_from_audio_part (url_analyse: string, audio_file_name: string) {
        $.ajax({
          url: url_analyse,
          type: 'GET',
          contentType: false,
          processData: false,
          success: (xmldata : XMLDocument) => {load_chorale(xmldata, true);}
        });
        }

createWavInput(urlLoadfile, (audio_file_name: string) =>
                  compute_chorale_from_audio_part(serverUrl + 'analyze-audio' + `?filename=${audio_file_name}`, audio_file_name));


Initialize_record(urlLoadfile, function(tempo_record: number) {
    return function (audio_file_name: string) {
      $.ajax({
        url: serverUrl + 'get-samples-dict' + `?filename=${audio_file_name}`,
        type: 'GET',
        contentType: false,
        processData: false,
        success: function(data) {
                  let sampledVoice;
                  if (data) {
                    voice_samples = data;
                    console.log(voice_samples);
                    sampledVoice = SampleLibrary.load({
                              instruments: ['voice'],
                              baseUrl: serverUrl + 'samples/'
                            });
                          };
                  Object.assign(sampledInstruments, {['voice'] : sampledVoice['voice']});
                  sampledInstruments['voice'].release = 1.8;
                  sampledInstruments['voice'].toMaster();
                  compute_chorale_from_audio_part(serverUrl + 'analyze-audio' + `?filename=${audio_file_name}` + `&tempo=${tempo_record}`, audio_file_name);
                }
           });
    }
  });

Initialize_canvas();

let constrainDrawingElem: HTMLElement = document.createElement("div");
constrainDrawingElem.id = 'constrain-drawing-button';
document.getElementById('drawing-controls').appendChild(constrainDrawingElem);

let constrainDrawing = new Nexus.TextButton('#constrain-drawing-button',{
    'size': [200,50],
    'state': false,
    'text': 'Follow drawing',
    'alternateText' : 'Stop following drawing'
});

constrainDrawing.on('change', (e) => {});
constrainDrawing.textElement.style.fontSize = '16px';

export {serverUrl};
export {load_chorale};
