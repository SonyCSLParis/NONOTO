import { ipcRenderer } from 'electron';
import * as log from 'loglevel';
import * as $ from 'jquery';

import LinkClient from './linkClient';

let Nexus = require('./nexusColored');

import * as BPM from './bpm';

declare var COMPILE_ELECTRON: boolean;  // uses webpack.DefinePlugin

let linkdisplayButton;

function registerDownbeatDisplayListener() {
    LinkClient.on('downbeat', () => {
        linkdisplayButton.down();
        if (linkDisplayTimeout) clearTimeout(linkDisplayTimeout);
        linkDisplayTimeout = setTimeout(() => linkdisplayButton.up(), 100)}
    )
};

export function render() {
    let topControlsGridElem = document.getElementById('bottom-controls')
    let linkbuttonElem: HTMLElement = document.createElement('control-item');
    linkbuttonElem.id = 'link-button'
    topControlsGridElem.appendChild(linkbuttonElem);

    let linkbutton = new Nexus.TextButton('#link-button',{
        'size': [150,50],
        'state': false,
        'text': 'Enable LINK',
        'alternateText': 'Disable LINK'
    });

    function toggleLinkClient(enable: boolean): void {
        if (enable) {
            LinkClient.enable();
        }
        else {
            LinkClient.disable();
        };
    };

    let firstPress: boolean = true;
    linkbutton.on('change', (enable) => {
        if (firstPress) {
            LinkClient.initializeClient();
            registerDownbeatDisplayListener();
            firstPress = false;
            if (!COMPILE_ELECTRON) {
                console.log("Scheduling connect callback");
                LinkClient.once('connect', () => {
                    toggleLinkClient(enable);
                    console.log("Deferred link client toggling");
                });
                return;
            }
        }
        toggleLinkClient(enable);
    });
};

let linkDisplayTimeout;
export function renderDownbeatDisplay(): void{
    let topControlsGridElem = document.getElementById('bottom-controls')
    let linkdisplayElem: HTMLElement = document.createElement('control-item');
    linkdisplayElem.id = 'link-display';
    linkdisplayElem.style.pointerEvents = 'none';
    topControlsGridElem.appendChild(linkdisplayElem);

    linkdisplayButton = new Nexus.Button('#link-display', {
        'size': [40, 40],
        'state': false,
        'mode': 'button'
    });
};
