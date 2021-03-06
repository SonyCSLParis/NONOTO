import { ipcRenderer } from 'electron'
import * as log from 'loglevel'
import * as $ from 'jquery'

let Nexus = require('./nexusColored')

import * as BPM from './bpm';
import * as Playback from './playback';


let link_channel_prefix: string = require('../common/config.json')['link_channel_prefix'];

let link_initialized: boolean = false;
let link_enabled: boolean = false;

function getState(): void {
    // get current state of the LINK-server on loading the client
    ipcRenderer.send(link_channel_prefix + 'ping');
}
getState();  // necessary to now on start-up if the LINK server is already
// initialized/enabled

// the `quantum` defines the desired number of quarter-notes between each
// 'downbeat', which are used to synchronize Play events.
// with a `quantum` of 4, DeepBach will wait and start playback on the
// beginning of a new measure (in a 4/4 time-signature setting)
let linkQuantum: number = 4;


// Enable / Disable
export function isEnabled(): boolean {
    return link_enabled
}

export function isInitialized(): boolean {
    return link_initialized
}

export async function enable() {
    if (!isInitialized()) {
        log.debug("Must initialize LINK");
        let bpm: number = BPM.getBPM();
        let quantum: number = linkQuantum;
        // hang asynchronously on this call
        await ipcRenderer.send(link_channel_prefix + 'init', bpm, quantum);
        link_initialized = true;
    }
    ipcRenderer.send(link_channel_prefix + 'enable');
    ipcRenderer.once(link_channel_prefix + 'enabled-status',
        (_, enabledStatus: boolean) => {
            if (enabledStatus) {
                Playback.setPhaseSynchronous();
            }
        }
    );
}

export function disable(): void {
    if (isInitialized()) {
        ipcRenderer.send(link_channel_prefix + 'disable');
    }
}

export function kill(): void {
    ipcRenderer.send(link_channel_prefix + 'kill');
}


ipcRenderer.on(link_channel_prefix + 'initialized-status',
    (_, initializedStatus: boolean) => {
        link_initialized = initializedStatus;
        log.debug('initializedStatus:');
        log.debug(initializedStatus);
    }
);


ipcRenderer.on(link_channel_prefix + 'enabled-status', (_, enabledStatus: boolean) => {
    link_enabled = enabledStatus;
    log.debug(enabledStatus);
    log.debug('enabledStatus:');
});


// ipcRenderer.on(link_channel_prefix + 'enable-success', (_, enable_succeeded: boolean) => {
//         if (enable_succeeded) {
//             link_enabled = true;
//             setBPMtoLinkBPM_async();
//             log.info('Succesfully enabled Link');
//         }
//         else {log.error('Failed to enable Link')}
//     }
// )
//
// ipcRenderer.on(link_channel_prefix + 'disable-success', (_, disable_succeeded) => {
//         if (disable_succeeded) {
//             link_enabled = false;
//             log.info('Succesfully disabled Link');
//         }
//         else {log.error('Failed to disable Link')}
//     }
// )


// Tempo
ipcRenderer.on(link_channel_prefix + 'bpm', (_, newBPM) => {
        BPM.setBPM(newBPM);
    }
);

export function getPhaseSynchronous(): number {
    return ipcRenderer.sendSync(link_channel_prefix + 'get-phase-sync')
}

// retrieve current BPM from Link
export function setBPMtoLinkBPM_async(): void {
    if (isEnabled()) {
        ipcRenderer.send(link_channel_prefix + 'get-bpm');
    }
}

export function updateLinkBPM(newBPM) {
    ipcRenderer.send(link_channel_prefix + 'bpm', newBPM);
}

// numPeers
ipcRenderer.on('numPeers', (_, numPeers) => {
    // this display is required as per the Ableton-link test-plan
    // (https://github.com/Ableton/link/blob/master/TEST-PLAN.md)
    new Notification('DeepBach/Ableton LINK interface', {
        body: 'Number of peers changed, now ' + numPeers + ' peers'
  })
})


// Schedule a LINK dependent callback
export function on(message, callback) {
    ipcRenderer.on(link_channel_prefix + message, () => {
        callback();
    })
}


// Schedule a LINK dependent callback once
export function once(message, callback) {
    ipcRenderer.once(link_channel_prefix + message, () => {
        callback();
    })
}
