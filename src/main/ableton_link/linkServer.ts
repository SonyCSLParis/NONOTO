import LinkElectronModule = require('./linkServer.electron')
// TODO(theis): use external package ableton-link-server
import LinkSocketModule = require('./linkServer.socket-io')

// wrapper for the different available implementations of the Link Client
// implemented as described in
// https://github.com/TypeStrong/ts-loader/tree/master/test/comparison-tests/conditionalRequire

// HACK(theis): clean this by creating a proper TypeScript interface and two implementations
let Server

// defined at compile-time via webpack.DefinePlugin
declare let COMPILE_ELECTRON: boolean

if (COMPILE_ELECTRON) {
  const LinkElectron = <typeof LinkElectronModule>(
    require('./linkServer.electron')
  )
  Server = LinkElectron
} else {
  throw Error('Not implemented')
  const LinkSocket = <typeof LinkSocketModule>require('./linkServer.socket-io')
  Server = LinkSocket
}

export default Server
