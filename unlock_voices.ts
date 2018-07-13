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

export function make_voices_lockets() {
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
      set_font_size(no_voice_button, '12px');

      let soprano_locked = document.createElement('div');
      soprano_locked.id = 'soprano_locked';
      voiceBar.appendChild(soprano_locked);
      var soprano_button = new Nexus.TextButton('#soprano_locked',{
          'size': [60, 40],
          'state': false,
          'text': 'Lock',
          'alternateText': 'Unlock'
      });
      set_font_size(soprano_button, '12px');

      let alto_locked = document.createElement('div')
      alto_locked.id = 'alto_locked';
      voiceBar.appendChild(alto_locked);
      var alto_button = new Nexus.TextButton('#alto_locked',{
          'size': [60, 40],
          'state': false,
          'text': 'Lock',
          'alternateText': 'Unlock'
      });
      set_font_size(alto_button, '12px');

      let tenor_locked = document.createElement('div')
      tenor_locked.id = 'tenor_locked';
      voiceBar.appendChild(tenor_locked);
      var tenor_button = new Nexus.TextButton('#tenor_locked',{
          'size': [60, 40],
          'state': false,
          'text': 'Lock',
          'alternateText': 'Unlock'
      });
      set_font_size(tenor_button, '12px');

      let bass_locked = document.createElement('div')
      bass_locked.id = 'bass_locked';
      voiceBar.appendChild(bass_locked);
      var bass_button = new Nexus.TextButton('#bass_locked',{
          'size': [60, 40],
          'state': false,
          'text': 'Lock',
          'alternateText': 'Unlock'
      })
      set_font_size(bass_button, '12px');

      function get_locked_voices() {
        UrlTimerangeChange = 'timerange-change' +
                                `?sopranoLocked=${soprano_button.state}` +
                                `&altoLocked=${alto_button.state}` +
                                `&tenorLocked=${tenor_button.state}` +
                                `&bassLocked=${bass_button.state}`;

      };
      get_locked_voices();
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
}

export {UrlTimerangeChange};
