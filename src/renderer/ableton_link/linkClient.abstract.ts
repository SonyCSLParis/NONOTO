import EventEmitter from 'events'
import { Locator } from '../locator'
import { BPMControl } from '../numberControl'
import { PlaybackManager } from '../playback'

export interface LinkClientConstructor {
  new (
    playbackManager: PlaybackManager<Locator>,
    bpmControl: BPMControl,
    quantum?: number
  ): AbletonLinkClient
}

export abstract class AbletonLinkClient extends EventEmitter {
  protected enabled = false
  readonly bpmControl: BPMControl
  constructor(
    playbackManager: PlaybackManager<Locator>,
    bpmControl: BPMControl,
    quantum?: number
  ) {
    super()
    this.bpmControl = bpmControl
    // TODO(theis): use event-based communication rather than direct registration
    playbackManager.registerLinkClient(this)

    this.getState() // necessary to know on start-up if the LINK server is already initialized
  }

  protected abstract quantum: number
  public abstract linkQuantum: number
  abstract getPhaseSynchronous(): number

  protected abstract getState(): void
  isEnabled(): boolean {
    return this.enabled
  }
  abstract isInitialized(): boolean
  abstract enable(playbackManager: PlaybackManager<Locator>): void
  abstract disable(): void
  abstract kill(): void

  abstract setBPMtoLinkBPM_async(): void
  abstract updateLinkBPM(bpm: number): void

  protected abstract registerCallbacks(): void
  abstract on(message: string, callback: () => void): this
  abstract once(message: string, callback: () => void): this
  abstract removeListener(message: string, callback: () => void): this
}
