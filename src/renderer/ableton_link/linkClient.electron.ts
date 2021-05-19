import { ipcRenderer, Notification } from 'electron'
import log from 'loglevel'

import { AbletonLinkClient } from './linkClient.abstract'

import { BPMControl } from '../numberControl'
import { PlaybackManager } from '../playback'
import { Locator } from '../locator'

import default_config from '../../common/default_config.json'
const link_channel_prefix: string = default_config['link_channel_prefix']

export class LinkClientElectron extends AbletonLinkClient {
  protected initialized = false
  protected enabled = false

  protected quantum: number

  // the `quantum` defines the desired number of quarter-notes between each
  // 'downbeat', which are used to synchronize Play events.
  // with a `quantum` of 4, DeepBach will wait and start playback on the
  // beginning of a new measure (in a 4/4 time-signature setting)
  linkQuantum = 4

  constructor(
    playbackManager: PlaybackManager<Locator>,
    bpmControl: BPMControl,
    quantum?: number
  ) {
    super(playbackManager, bpmControl, quantum)
  }

  protected getState(): void {
    // get current state of the LINK-server on loading the client
    ipcRenderer.send(link_channel_prefix + 'ping')
  }

  isEnabled(): boolean {
    return this.enabled
  }

  isInitialized(): boolean {
    return this.initialized
  }

  enable(playbackManager: PlaybackManager<Locator>): void {
    if (!this.isInitialized()) {
      log.debug('Must initialize LINK')
      const bpm: number = this.bpmControl.value
      const quantum: number = this.quantum

      ipcRenderer.send(link_channel_prefix + 'init', bpm, quantum)
      this.initialized = true
    }
    ipcRenderer.send(link_channel_prefix + 'enable')
    ipcRenderer.once(
      link_channel_prefix + 'enabled-status',
      (_, enabledStatus: boolean) => {
        if (enabledStatus) {
          playbackManager.synchronizeToLink()
        }
      }
    )
  }

  disable(): void {
    if (this.isInitialized()) {
      ipcRenderer.send(link_channel_prefix + 'disable')
    }
  }

  kill(): void {
    ipcRenderer.send(link_channel_prefix + 'kill')
  }

  protected registerCallbacks(): void {
    ipcRenderer.on(
      link_channel_prefix + 'initialized-status',
      (_, initialized: boolean) => {
        this.initialized = initialized
        log.debug(`Ableton Link Server: initializedStatus: ${initialized}`)
      }
    )

    ipcRenderer.on(
      link_channel_prefix + 'enabled-status',
      (_, enabledStatus: boolean) => {
        this.enabled = enabledStatus
        log.debug(enabledStatus)
        log.debug('enabledStatus:')
      }
    )

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
      this.emit('bpm', newBPM)
    })

    // numPeers
    ipcRenderer.on('numPeers', (_, numPeers) => {
      // this display is required as per the Ableton-link test-plan
      // (https://github.com/Ableton/link/blob/master/TEST-PLAN.md)
      new Notification({
        title: 'NONOTO',
        body:
          'Number of Ableton LINK peers changed, now ' + numPeers + ' peers',
      }).show()
    })
  }

  getPhaseSynchronous(): number {
    return ipcRenderer.sendSync(link_channel_prefix + 'get-phase-sync')
  }

  // retrieve current BPM from Link
  setBPMtoLinkBPM_async(): void {
    if (this.isEnabled()) {
      ipcRenderer.send(link_channel_prefix + 'get-bpm')
    }
  }

  updateLinkBPM(bpm: number): void {
    ipcRenderer.send(link_channel_prefix + 'bpm', bpm)
  }

  // Schedule a LINK dependent callback
  on(message: string, callback: () => void): this {
    ipcRenderer.on(link_channel_prefix + message, callback.bind(this))
    return this
  }

  // Schedule a LINK dependent callback once
  once(message: string, callback: () => void): this {
    ipcRenderer.once(link_channel_prefix + message, callback.bind(this))
    return this
  }

  // Schedule a LINK dependent callback once
  removeListener(message: string, callback: () => void): this {
    ipcRenderer.removeListener(link_channel_prefix + message, callback)
    return this
  }
}
