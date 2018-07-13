import * as Recorder from 'Recorderjs';
import * as Nexus from 'nexusui';
import * as Raphael from 'raphael';
import * as Tone from "tone";


function metronome(opts) {
    var l = typeof opts.len !== "undefined" ? opts.len : 200, // length of metronome arm
        r = typeof opts.angle !== "undefined" ? opts.angle : 20, //max angle from upright
    	   w = 2 * l * Math.cos(r),
        playSound = typeof opts.sound !== "undefined" ? opts.sound : true;

	// initialize Raphael paper if need be
    switch(typeof opts.paper) {
		case "string": opts.paper = Raphael(opts.paper, w, l + 20); break;
		default: opts.paper = Raphael(0, 0, w, l + 20); break;
    }

	// initialize audio if need be
    if (playSound && opts.audio) {
		var sound: HTMLMediaElement = document.createElement('audio');
		sound.setAttribute('src', opts.audio);
		sound.id = 'tick';
		document.body.appendChild(sound);
    }

    var y0 = l * Math.cos(Math.PI * r / 180),
        x0 = l * Math.sin(Math.PI * r / 180),
        y = l + 10,
        x = x0 + 10,
        tick_count = 0;

    var outline = opts.paper.path("M"+x+","+y+"l-"+x0+",-"+y0+"a"+l+","+l+" "+2*r+" 0,1 "+2*x0+",0L"+x+","+y).attr({
        fill: "#EEF",
        'stroke-width': 0
    });

    var arm = opts.paper.path("M" + x + "," + (y + 5) + "v-" + (l - 5)).attr({
        'stroke-width': 5,
        stroke: "#999"
    }).data("id", "arm");

    var weight = opts.paper.path("M" + x + "," + (y-100) + "h12l-3,18h-18l-3-18h12").attr({
        'stroke-width': 0,
        fill: '#666'
    }).data("id", "weight");

    var vertex = opts.paper.circle(x, y, 7).attr({
        'stroke-width': 0,
        fill: '#CCC'
    }).data("id", "vertex");

    var label = opts.paper.text(x, y + 20, "").attr({
        "text-anchor": "center",
        "font-size": 14
    });

    var mn = opts.paper.set(arm, weight);
    Raphael.easing_formulas.sinoid = function(n) { return Math.sin(Math.PI * n / 2) };

return {
    start: function(tempo, repeats) {
                tick_count = 0;
                mn.attr("transform", "R-20 " + x + "," + y);
                var interval = 120000 / tempo;

         var ticktockAnimationParam = {
            "50%": { transform:"R20 " + x + "," + y, easing: "sinoid", callback: () => {if (playSound) {
                            sound.play();}}},
            "100%": { transform:"R-20 " + x + "," + y, easing: "sinoid", callback: () => {if (playSound) {
                            sound.play();}}}
          };
                //animation
    			var ticktock = Raphael.animation(ticktockAnimationParam, interval).repeat(repeats / 2);
    			arm.animate(ticktock);
    			weight.animateWith(arm, ticktockAnimationParam, ticktock);
        },
    stop: function() {
                mn.stop();
                mn.attr("transform", "R0 " + x + "," + y);
        },
    shapes: function() {
      return {
      outline: outline,
      arm: arm,
      weight: weight,
      vertex: vertex
      }
    }
  };
}

let serverConfig: object = require('./config.json');

// let serverUrl = `http://${serverConfig['server_ip']}:${serverConfig['chorale_port']}/`;


export function Initialize_record(onSuccess, serverUrl) {
    try {
        // window.AudioContext = window.AudioContext || window.webkitAudioContext;
        // navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        // window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        console.log('Audio context is ready !');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }

    var audio_context;
    var recorder;
    var audio_stream;

    // let recordContainer: HTMLDivElement = document.createElement('div')
    // recordContainer.id = 'voice-controls';
    // document.body.appendChild(recordContainer);
    let metronome_container: HTMLElement = document.createElement('div');
    metronome_container.id = 'metronome_container';
    document.body.appendChild(metronome_container);

    let bpmSliderRecordElem: HTMLElement = document.createElement('div');
    bpmSliderRecordElem.setAttribute('id', 'bpm-slider-record');
    metronome_container.appendChild(bpmSliderRecordElem);

    let bpmCounterRecordElem: HTMLElement = document.createElement('div');
    bpmCounterRecordElem.setAttribute('id', 'bpm-counter-record');
    bpmCounterRecordElem.style.pointerEvents = 'none';
    bpmCounterRecordElem.style.margin = 'auto';
    metronome_container.appendChild(bpmCounterRecordElem);

    let bpmSliderRecord = new Nexus.Slider('#bpm-slider-record', {
        'size':[150, 40],
        'min': 80,
        'max': 130,
        'step': 1
    });
    let bpmCounterRecord = new Nexus.Number('#bpm-counter-record', {
        'size': [50, 30],
        'min': 80,
        'max': 130,
        'step': 1
    });
    bpmCounterRecord.link(bpmSliderRecord);
    bpmSliderRecord.value = 110;

    let m = metronome({
        len: 200,
        angle: 20,
        paper: "metronome_container",
        audio: "https://github.com/wilson428/metronome/blob/master/tick.wav?raw=true"
    });
    m.shapes().outline.attr("fill", "#0962ba");
    m.shapes().arm.attr("stroke", "#EEE");

    bpmSliderRecord.on('change', function(value){
        m.stop();
        if (record_button.state) {
          m.start(value, 10000);
        }
    });

    let startRecord = document.createElement('div')
    startRecord.id = 'startRecord';
    startRecord.style.position = 'absolute';
    startRecord.style.top = '0px';
    metronome_container.appendChild(startRecord);

    let record_button = new Nexus.TextButton('#startRecord',{
        'size': [150,50],
        'state': false,
        'text': 'Start recording',
        'alternateText': 'Stop recording'
    });
    record_button.textElement.style.fontSize = '17px';
    record_button.on('change', (e) => { if (record_button.state) {
                                              startRecording();
                                              m.start(bpmSliderRecord.value, 10000);
                                            }

                                        else {
                                          m.stop();
                                          var _AudioFormat = "audio/wav";
                                          stopRecording( function(AudioBLOB) {
                                              // callback for exportWAV
                                              console.log(AudioBLOB);
                                              var data = new FormData();
                                              data.append('record', AudioBLOB, 'audio.wav');
                                              $.ajax({
                                                url :  serverUrl + 'analyze-audio' + `?tempo=${bpmSliderRecord.value}`,
                                                type: 'POST',
                                                data: data,
                                                contentType: false,
                                                processData: false,
                                                success: onSuccess,
                                                // error: function() {
                                                //   alert("not so boa!");
                                                // }
                                              });
                                          }, _AudioFormat);
                                        }

    })
    function startRecording() {
        // Access the Microphone using the navigator.getUserMedia method to obtain a stream
        navigator.getUserMedia({ audio: true }, function (stream) {

            audio_stream = stream;
            var input = audio_context.createMediaStreamSource(stream);
            console.log('Media stream succesfully created');

            recorder = new Recorder(input);
            console.log('Recorder initialised');

            recorder;
            recorder.recording = true;
            console.log('Recording...');
        }, function (e) {
            console.error('No live audio input: ' + e);
        });
    }

    function stopRecording(callback, AudioFormat) {
        recorder && recorder.stop();
        console.log('Stopped recording.');
        audio_stream.getAudioTracks()[0].stop();

        if(typeof(callback) == "function"){

            /**
             * Export the AudioBLOB using the exportWAV method.
             */
            recorder;
            recorder.exportWAV(function (blob) {
                callback(blob);
                recorder.clear();

            }, (AudioFormat || "audio/wav"));
        }
    }
}
