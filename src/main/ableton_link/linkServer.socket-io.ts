import { ipcMain } from 'electron'
import log from 'loglevel'
import abletonlink from 'abletonlink'

import * as WindowManager from '../windowManager'

// Code for Ableton-LINK server

import default_config from '../../common/default_config.json'
const link_channel_prefix: string = default_config['link_channel_prefix']
let link = undefined
let link_enabled = false

function isLinkInitialized(): boolean {
  return link != undefined
}

function isLinkEnabled(): boolean {
  return link_enabled
}

function setLinkEnabled(enable: boolean): void {
  link_enabled = enable
  WindowManager.send(link_channel_prefix + 'enabled-status', isLinkEnabled())
}

function initAbletonLinkServer(
  bpm = 120,
  quantum = 4,
  enable = false
): boolean {
  link = new abletonlink(bpm, quantum, enable)
  setLinkEnabled(enable)
  // TODO(theis): how to detect errors in initialization?
  log.info(link)
  const success = true

  link.on('tempo', (bpm) => {
    log.info('LINK: BPM changed, now ' + bpm)
    WindowManager.send(link_channel_prefix + 'tempo', bpm)
  })

  link.on('numPeers', (numPeers) => {
    log.info('LINK: numPeers changed, now ' + numPeers)
    WindowManager.send(link_channel_prefix + 'numPeers', numPeers)
  })

  return success
}

function startLinkDownbeatClock(updateRate_ms = 16): void {
  // Start a LINK-based downbeat clock using IPC messages
  // updateRate_ms, number: interval (in ms) between updates in the clock
  let lastBeat = 0.0
  let lastPhase = 0.0
  link.startUpdate(updateRate_ms, (beat, phase) => {
    beat = 0 ^ beat
    if (0 < beat - lastBeat) {
      WindowManager.send('beat', { beat })
      lastBeat = beat
    }
    if (0 > phase - lastPhase) {
      WindowManager.send(link_channel_prefix + 'downbeat')
      log.debug('LINK: downbeat')
    }
    lastPhase = phase
  })
}

function stopLinkDownbeatClock(): void {
  // Stop the LINK-based downbeat clock
  link.stopUpdate()
}

// IPC API for the link server

// Initialize LINK server
export function attachListeners(): void {
  // TODO(theis): clean this up
  // ipcMain.on(link_channel_prefix + 'init', (event, bpm, quantum) => {
  // });

  ipcMain.on(link_channel_prefix + 'ping', (event) => {
    if (isLinkInitialized()) {
      event.sender.send(link_channel_prefix + 'initialized-status', true)
      event.sender.send(link_channel_prefix + 'enabled-status', isLinkEnabled())
    } else {
      event.sender.send(link_channel_prefix + 'initialized-status', false)
      event.sender.send(link_channel_prefix + 'enabled-status', false)
    }
  })

  // Update LINK on tempo changes coming from the client
  ipcMain.on(link_channel_prefix + 'tempo', (event, newBPM) => {
    // HACK perform a comparison to avoid messaging loops, since
    // the link update triggers a BPM modification message
    // from main to renderer
    if (isLinkInitialized() && link.bpm !== newBPM) {
      const link_bpm_before = link.bpm
      link.bpm = newBPM
      log.debug('LINK: Triggered LINK tempo update:')
      log.debug(`\tBefore: ${link_bpm_before}, now: ${newBPM}`)
    }
  })

  // Enable LINK and start a downbeat clock to synchronize Transport
  ipcMain.on(link_channel_prefix + 'enable', (event) => {
    link.enable() // enable backend LINK-server
    startLinkDownbeatClock()
    setLinkEnabled(true)
    event.sender.send(link_channel_prefix + 'enable-success', true)
  })

  // Disable LINK
  ipcMain.on(link_channel_prefix + 'disable', (event) => {
    stopLinkDownbeatClock()
    link.disable() // disable the backend LINK-server
    setLinkEnabled(false)
    event.sender.send(link_channel_prefix + 'disable-success', true)
  })

  // Accessor for retrieving the current LINK tempo
  ipcMain.on(link_channel_prefix + 'get-bpm', (event) => {
    if (link.isEnabled()) {
      event.sender.send(link_channel_prefix + 'bpm', link.bpm)
    }
  })

  ipcMain.on(link_channel_prefix + 'kill', () => killLink())
}

function disableLink(): void {
  if (isLinkInitialized()) {
    stopLinkDownbeatClock()
    link.disable() // disable the backend LINK-server
  }
  setLinkEnabled(false)
}

export function killLink(): void {
  // kill the LINK server
  log.info('Killing the LINK server')
  disableLink()
  link = undefined
  WindowManager.send(link_channel_prefix + 'initialized-status', false)
}
