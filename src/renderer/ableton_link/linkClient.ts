import { LinkClientConstructor } from './linkClient.abstract'
export { AbletonLinkClient } from './linkClient.abstract'

let AbletonLinkClientImplementation: LinkClientConstructor

// defined at compile-time via webpack.DefinePlugin
declare let COMPILE_ELECTRON: boolean

export async function getAbletonLinkClientClass(): Promise<LinkClientConstructor> {
  if (!AbletonLinkClientImplementation) {
    if (COMPILE_ELECTRON) {
      const LinkClientElectron = (await import('./linkClient.electron'))
        .LinkClientElectron
      AbletonLinkClientImplementation = LinkClientElectron
    } else {
      throw Error('Update implementation to class-based interface')
      // const LinkClientSocketIO = (await import('./linkClient.socket-io')).LinkClientSocketIO;
      // AbletonLinkClientImplementation = LinkClientSocketIO
    }
  }
  return AbletonLinkClientImplementation
}

export default getAbletonLinkClientClass
