import * as log from 'loglevel'
import * as $ from 'jquery'

log.setLevel(log.levels.INFO);

let Nexus = require('./nexusColored')

import * as BPM from './bpm'

let link_channel_prefix: string = require('../common/config.json')['link_channel_prefix'];

import * as io from 'socket.io-client';
// connect to the Ableton Link Node.js server
let socket;

export function initializeClient(): void {
    socket = io('http://localhost:3000');

    // bind event listeners
    socket.on('connect', () => {
        log.info('LINK-CLIENT: Connected to Ableton-LINK server!');
        getState();
    });

    socket.on(link_channel_prefix + 'initialized-status', (initializedStatus) => {
        link_initialized = initializedStatus;
    });


    socket.on(link_channel_prefix + 'enabled-status', (enabledStatus) => {
        link_enabled = enabledStatus;
    });


    socket.on(link_channel_prefix + 'enable-success', (enable_succeeded) => {
            if (enable_succeeded) {
                link_enabled = true;
                setBPMtoLinkBPM_async();
                log.info('Succesfully enabled Link');
            }
            else {log.error('Failed to enable Link')}
        }
    )

    socket.on(link_channel_prefix + 'disable-success', (disable_succeeded) => {
            if (disable_succeeded) {
                link_enabled = false;
                log.info('Succesfully disabled Link');
            }
            else {log.error('Failed to disable Link')}
        }
    )

    // Tempo
    socket.on(link_channel_prefix + 'tempo', (newBPM) => {
        BPM.setBPM(newBPM); }
    );

    // numPeers
    socket.on('numPeers', (numPeers) => {
        // this display is required as per the Ableton-link test-plan
        // (https://github.com/Ableton/link/blob/master/TEST-PLAN.md)
        new Notification('DeepBach/Ableton LINK interface', {
            body: 'Number of peers changed, now ' + numPeers + ' peers'
      })
    });
}

let link_initialized: boolean = false;
let link_enabled: boolean = false;

function getState(): void {
    // get current state of the LINK-server on loading the client
    socket.emit(link_channel_prefix + 'ping');
}

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

export function enable() {
    log.info('LINK: Sending enable message')
    new Promise((resolve, reject) => {
        if (!isInitialized()) {
            let bpm: number = BPM.getBPM();
            let quantum: number = linkQuantum;
            // hang asynchronously on this call
            socket.emit(link_channel_prefix + 'init', bpm, quantum,
                resolve)
        }
        else {
            resolve()
        }
    }).then(() => socket.emit(link_channel_prefix + 'enable'))
}

export function disable(): void {
    if (isInitialized()) {
        socket.emit(link_channel_prefix + 'disable');
    }
}


export function kill(): void {
    socket.emit(link_channel_prefix + 'kill');
}

// Tempo
export function setBPMtoLinkBPM_async(): void {
    if (isEnabled()) {
        socket.emit(link_channel_prefix + 'get_bpm');
    }
}

export function updateLinkBPM(newBPM) {
    socket.emit(link_channel_prefix + 'tempo', newBPM);
}


// Schedule a LINK dependent callback
export function on(message, callback) {
    socket.on(link_channel_prefix + message, () => {
        callback();
})
}


// Schedule a LINK dependent callback once
export function once(message, callback) {
    socket.once(link_channel_prefix + message, () => {
        callback();;
    })
}
