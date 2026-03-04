import { DeskThing } from '@deskthing/server'
import './dist/server/index.js'

async function debug() {
  try {
    const listeners = DeskThing.listeners('start')
    if (listeners.length > 0) {
      await listeners[0]()
      console.log('STARTUP SUCCESS')
    } else {
      console.log('NO START LISTENER')
    }
  } catch (err) {
    console.error('CAUGHT ERROR:', err)
  }
}

debug()
