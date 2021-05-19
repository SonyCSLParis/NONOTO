import { AbletonLinkClient } from './linkClient'
import * as ControlLabels from '../controlLabels'

import Nexus from '../nexusColored'
import { PlaybackManager } from '../playback'
import { Locator } from '../locator'
import log from 'loglevel'

export function render(
  linkClient: AbletonLinkClient,
  playbackManager: PlaybackManager<Locator>
): void {
  const bottomControlsElementID = 'bottom-controls'
  const bottomControlsGridElement = document.getElementById(
    bottomControlsElementID
  )
  if (bottomControlsGridElement == null) {
    log.error(`Container element ${bottomControlsElementID} not found`)
    return
  }
  const abletonLinkSettingsGridspan = document.createElement('div')
  abletonLinkSettingsGridspan.id = 'ableton-link-settings-gridspan'
  abletonLinkSettingsGridspan.classList.add('gridspan')
  abletonLinkSettingsGridspan.classList.add('advanced')
  bottomControlsGridElement.appendChild(abletonLinkSettingsGridspan)

  const linkEnableButtonElement = document.createElement('div')
  linkEnableButtonElement.id = 'link-enable-button'
  linkEnableButtonElement.classList.add('control-item')
  abletonLinkSettingsGridspan.appendChild(linkEnableButtonElement)

  const linkEnableButton = new Nexus.Button('#link-enable-button', {
    size: [30, 30],
    state: false,
    mode: 'toggle',
  })
  linkEnableButton.on('change', (enable: boolean) => {
    if (enable) {
      linkClient.enable(playbackManager)
    } else {
      linkClient.disable()
    }
  })
  ControlLabels.createLabel(
    linkEnableButton,
    'link-enable-button-label',
    false,
    undefined,
    abletonLinkSettingsGridspan
  )

  // Add manual Link-Sync button
  renderSyncButton(abletonLinkSettingsGridspan, playbackManager)

  renderDownbeatDisplay(linkClient)
}

function renderSyncButton(
  container: HTMLElement,
  playbackManager: PlaybackManager<Locator>
) {
  const linkbuttonElement = document.createElement('div')
  linkbuttonElement.id = 'sync-button'
  linkbuttonElement.classList.add('control-item', 'advanced')
  container.appendChild(linkbuttonElement)

  const syncButton = new Nexus.Button('#sync-button', {
    size: [30, 30],
    state: false,
    mode: 'impulse',
  })
  syncButton.on('change', (enable: boolean) => {
    if (enable) {
      playbackManager.synchronizeToLink()
    }
  })

  ControlLabels.createLabel(
    syncButton,
    'link-force-resync-button-label',
    false,
    undefined,
    container
  )
}

export function renderDownbeatDisplay(linkClient: AbletonLinkClient): void {
  const abletonLinkSettingsGridspan = document.getElementById(
    'ableton-link-settings-gridspan'
  )
  const linkDownbeatDisplayElement = document.createElement('div')
  linkDownbeatDisplayElement.id = 'link-downbeat-display'
  linkDownbeatDisplayElement.classList.add('control-item', 'disable-mouse')
  linkDownbeatDisplayElement.style.pointerEvents = 'none'
  abletonLinkSettingsGridspan.appendChild(linkDownbeatDisplayElement)

  const linkDownbeatDisplayButton = new Nexus.Button('#link-downbeat-display', {
    size: [20, 20],
    state: false,
    mode: 'button',
  })
  ControlLabels.createLabel(
    linkDownbeatDisplayButton,
    'link-downbeat-display-label',
    true,
    undefined,
    abletonLinkSettingsGridspan
  )

  let linkDisplayTimeout: NodeJS.Timeout
  linkClient.on('downbeat', () => {
    linkDownbeatDisplayButton.down()
    if (linkDisplayTimeout) clearTimeout(linkDisplayTimeout)
    linkDisplayTimeout = setTimeout(() => linkDownbeatDisplayButton.up(), 100)
  })
}
