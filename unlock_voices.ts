let UrlTimerangeChange = 'timerange-change';
import * as Nexus from 'nexusui';
import * as $ from "jquery";


import './styles/osmd.scss'
import './styles/main.scss'

Nexus.colors.accent = '#ffb6c1';  // '#f40081';  //  light pink
Nexus.colors.fill = '#e5f5fd';  // light blue // '#f0f2ff';  // lilac triadic to '#ffb6c1'

function set_font_size (nex_but, size) {
  nex_but.textElement.style.fontSize = size;
};

export function make_voices_lockets(uploading=false) {
  if (uploading){
    let voiceBar = document.getElementById('voice-controls');
    voiceBar.parentNode.removeChild(voiceBar);
  }
  let voiceBar: HTMLDivElement = document.createElement('div')
  voiceBar.id = 'voice-controls';
  document.body.appendChild(voiceBar);

  let no_voice_locked = document.createElement('div')
  no_voice_locked.id = 'no_voice_locked';
  voiceBar.appendChild(no_voice_locked);

  var no_voice_button = new Nexus.TextButton('#no_voice_locked',{
      'size': [60, 40],
      'state': false,
      'text': 'Unlock all'
  });

  let soften_locks = document.createElement('div')
  soften_locks.id = 'soften-locks';
  voiceBar.appendChild(soften_locks);

  var soften_button = new Nexus.TextButton('#soften-locks',{
      'size': [60, 40],
      'state': false,
      'text': 'Soft locks',
      'alternateText': 'Hard locks'
  });

  let soprano_locked = document.createElement('div');
  soprano_locked.id = 'soprano_locked';
  voiceBar.appendChild(soprano_locked);

  var soprano_button = new Nexus.TextButton('#soprano_locked',{
      'size': [60, 40],
      'state': false,
      'text': 'Lock',
      'alternateText': 'Unlock'
  });

  let alto_locked = document.createElement('div')
  alto_locked.id = 'alto_locked';
  voiceBar.appendChild(alto_locked);

  var alto_button = new Nexus.TextButton('#alto_locked',{
      'size': [60, 40],
      'state': false,
      'text': 'Lock',
      'alternateText': 'Unlock'
  });


  let tenor_locked = document.createElement('div')
  tenor_locked.id = 'tenor_locked';
  voiceBar.appendChild(tenor_locked);

  var tenor_button = new Nexus.TextButton('#tenor_locked',{
      'size': [60, 40],
      'state': false,
      'text': 'Lock',
      'alternateText': 'Unlock'
  });

  let bass_locked = document.createElement('div')
  bass_locked.id = 'bass_locked';
  voiceBar.appendChild(bass_locked);

  var bass_button = new Nexus.TextButton('#bass_locked',{
      'size': [60, 40],
      'state': false,
      'text': 'Lock',
      'alternateText': 'Unlock'
  });

  set_font_size(no_voice_button, '12px');
  set_font_size(soprano_button, '12px');
  set_font_size(alto_button, '12px');
  set_font_size(tenor_button, '12px');
  set_font_size(bass_button, '12px');
  set_font_size(soften_button, '12px');

  soprano_button.on('change', (e) => get_locked_voices());
  alto_button.on('change', (e) => get_locked_voices());
  tenor_button.on('change', (e) => get_locked_voices());
  bass_button.on('change', (e) => get_locked_voices());
  no_voice_button.on('change', (e) => {
                                  soprano_button.flip(false);
                                  alto_button.flip(false);
                                  tenor_button.flip(false);
                                  bass_button.flip(false);
                                  (e) => get_locked_voices();
                                });
  soften_button.on('change', (e) => get_locked_voices());

  function get_locked_voices() {
    UrlTimerangeChange = 'timerange-change' +
                            `?sopranoLocked=${soprano_button.state}` +
                            `&altoLocked=${alto_button.state}` +
                            `&tenorLocked=${tenor_button.state}` +
                            `&bassLocked=${bass_button.state}` +
                            `&softenLocks=${soften_button.state}`;

  };
  get_locked_voices();

  if (uploading){
    soprano_button.flip(true);
  }
}

// export function lock_soprano() {
//   soprano_button.flip(true);
// }

export {UrlTimerangeChange};
