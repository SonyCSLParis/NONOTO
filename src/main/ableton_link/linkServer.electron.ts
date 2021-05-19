import { ipcMain } from 'electron'
import log from 'loglevel'
import AbletonLinkWithMissingProperties from 'abletonlink'

// adds missing properties to the Ableton
class AbletonLink extends AbletonLinkWithMissingProperties {
  bpm: number
  phase: number

  constructor(bpm?: number, quantum?: number, enable?: boolean) {
    super(bpm, quantum, enable)
  }
}

import * as WindowManager from '../windowManager'

// Code for Ableton-LINK server

import default_config from '../../common/default_config.json'
const link_channel_prefix: string = default_config['link_channel_prefix']
let link: AbletonLink
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
  link = new AbletonLink(bpm, quantum, enable)
  WindowManager.send(link_channel_prefix + 'initialized-status', true)

  setLinkEnabled(enable)
  // TODO(theis): how to detect errors in initialization?
  log.info(link)
  const success = true

  link.onTempoChanged((bpm: number) => {
    console.log('LINK: BPM changed, now ' + bpm)
    log.info('LINK: BPM changed, now ' + bpm)

    WindowManager.send(link_channel_prefix + 'bpm', bpm)
  })

  link.onNumPeersChanged((numPeers: number) => {
    log.info('LINK: numPeers changed, now ' + numPeers)

    WindowManager.send(link_channel_prefix + 'numPeers', numPeers)
  })

  link.startUpdate(50)

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
      WindowManager.send(link_channel_prefix + 'beat', { beat })
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
    log.debug('Received ping!')
  })

  // Update LINK on tempo changes coming from the client
  ipcMain.on(link_channel_prefix + 'bpm', (_, newBPM: number) => {
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
  ipcMain.on(link_channel_prefix + 'enable', () => {
    if (!isLinkInitialized()) {
      initAbletonLinkServer()
    }
    if (!isLinkEnabled()) {
      link.enable() // enable backend LINK-server
      startLinkDownbeatClock(5)
      setLinkEnabled(true)
      // event.sender.send(link_channel_prefix + 'enable-success', true)
    }
  })

  // Disable LINK
  ipcMain.on(link_channel_prefix + 'disable', () => {
    if (isLinkInitialized() && isLinkEnabled()) {
      stopLinkDownbeatClock()
      link.disable() // disable the backend LINK-server
      setLinkEnabled(false)
      // event.sender.send(link_channel_prefix + 'disable-success', true)
    }
  })

  // Accessor for retrieving the current LINK tempo
  ipcMain.on(link_channel_prefix + 'get-bpm', (event) => {
    if (isLinkEnabled()) {
      event.sender.send(link_channel_prefix + 'bpm', link.bpm)
    }
  })

  // Accessor for retrieving the current LINK phase
  // the `phase` is equal to the advance in beats in the current Link block
  // where the block has size `quantum` as defined at link initialization
  ipcMain.on(link_channel_prefix + 'get-phase-sync', (event) => {
    event.returnValue = link.phase
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
