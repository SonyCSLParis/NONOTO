import * as Recorder from 'Recorderjs';
import * as Nexus from 'nexusui';

let serverConfig: object = require('./config.json');

// let serverUrl = `http://${serverConfig['server_ip']}:${serverConfig['chorale_port']}/`;
let serverUrl = 'http://localhost:5001/';



export function Initialize_record(onSuccess) {
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

    let startRecord = document.createElement('div')
    startRecord.id = 'startRecord';
    document.body.appendChild(startRecord);
    let record_button = new Nexus.TextButton('#startRecord',{
        'size': [150,50],
        'state': false,
        'text': 'Start recording',
        'alternateText': 'Stop recording'
    });
    record_button.textElement.style.fontSize = '17px';
    record_button.on('change', (e) => { if (record_button.state) {
                                              startRecording();
                                            }

                                        else {
                                          var _AudioFormat = "audio/wav";
                                          stopRecording( function(AudioBLOB) {
                                              // callback for exportWAV
                                              console.log(AudioBLOB);
                                              var data = new FormData();
                                              data.append('record', AudioBLOB, 'audio.wav');
                                              $.ajax({
                                                url :  serverUrl + 'analyze-audio',
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
