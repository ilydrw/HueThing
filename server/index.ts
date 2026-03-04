import { DeskThing } from '@deskthing/server'
import { SETTING_TYPES, EventMode, STEP_TYPES } from '@deskthing/types'
import { HueService } from './hueService.js'
import type { HueState } from './hueTypes.js'

const hueService = new HueService()
let pollInterval: ReturnType<typeof setInterval> | null = null
let pollMs = 5000
let knobStep = 5

// ─── Lifecycle ──────────────────────────────────────────────────────

async function startup() {
  try {
    console.log('[HueThing] Starting up...')

    // Load saved data
    const savedData = await DeskThing.getData()
    if (savedData) {
      const bridgeIp = savedData.bridgeIp as string | undefined
      const appKey = savedData.appKey as string | undefined
      const savedPollMs = savedData.pollInterval as number | undefined
      const savedKnobStep = savedData.knobStep as number | undefined
      if (savedPollMs) pollMs = Number(savedPollMs)
      if (savedKnobStep) knobStep = Number(savedKnobStep)

      if (bridgeIp && appKey) {
        console.log(`[HueThing] Restoring bridge config: ${bridgeIp}`)
        hueService.setConfig({ 
          bridgeIp, 
          appKey,
          clientKey: savedData.clientKey as string | undefined
        })
      }
    }

    console.log('[HueThing] Registering settings...')
    // Register settings
    await DeskThing.initSettings({
      bridgeIp: {
        id: 'bridgeIp',
        type: SETTING_TYPES.STRING,
        label: 'Hue Bridge IP',
        value: hueService.getConfig()?.bridgeIp || '',
        description: 'IP address of your Philips Hue Bridge'
      },
      appKey: {
        id: 'appKey',
        type: SETTING_TYPES.STRING, // Use STRING as DeskThing might not have PASSWORD type in all versions, but usually it's masked if it's sensitive
        label: 'Hue App Key (Username)',
        value: hueService.getConfig()?.appKey || '',
        description: 'Your bridge API username (Optional if pairing via app)'
      },
      clientKey: {
        id: 'clientKey',
        type: SETTING_TYPES.STRING,
        label: 'Hue Client Key',
        value: hueService.getConfig()?.clientKey || '',
        description: 'Used for Entertainment API (Optional)'
      },
      pollInterval: {
        id: 'pollInterval',
        type: SETTING_TYPES.RANGE,
        label: 'Refresh Interval (ms)',
        value: pollMs,
        min: 1000,
        max: 30000,
        step: 500,
        description: 'How often to refresh light states (if EventStream disconnected)'
      },
      knobStep: {
        id: 'knobStep',
        type: SETTING_TYPES.RANGE,
        label: 'Knob Step Size (%)',
        value: knobStep,
        min: 1,
        max: 20,
        step: 1,
        description: 'How much brightness changes per knob click'
      },
      themeColor: {
        id: 'themeColor',
        type: SETTING_TYPES.COLOR,
        label: 'UI Theme Color',
        value: '#bf5af2',
        description: 'Accent color on the Car Thing display'
      },
      iconColor: {
        id: 'iconColor',
        type: SETTING_TYPES.SELECT,
        label: 'Hardware Button Icon Color',
        value: 'white',
        description: 'Color of the physical Car Thing button icons',
        options: [
          { label: 'White (Default)', value: 'white' },
          { label: 'Orange', value: 'orange' },
          { label: 'Red', value: 'red' },
          { label: 'Green', value: 'green' },
          { label: 'Blue', value: 'blue' },
          { label: 'Purple', value: 'purple' },
          { label: 'Yellow', value: 'yellow' }
        ]
      }
    })

    console.log('[HueThing] Registering actions...')
    // Register actions
    DeskThing.registerAction({
      id: 'toggleAllLights',
      name: 'Toggle All Lights',
      description: 'Turn all lights on or off',
      version: '1.0.0',
      enabled: true,
      tag: 'basic'
    })
    DeskThing.registerAction({
      id: 'nextScene',
      name: 'Next Scene',
      description: 'Activate the next scene',
      version: '1.0.0',
      enabled: true,
      tag: 'basic'
    })
    DeskThing.registerAction({
      id: 'prevScene',
      name: 'Previous Scene',
      description: 'Activate the previous scene',
      version: '1.0.0',
      enabled: true,
      tag: 'basic'
    })
    DeskThing.registerAction({
      id: 'brightnessUp',
      name: 'Brightness Up',
      description: 'Increase brightness of active room',
      version: '1.0.0',
      enabled: true,
      tag: 'basic'
    })
    DeskThing.registerAction({
      id: 'brightnessDown',
      name: 'Brightness Down',
      description: 'Decrease brightness of active room',
      version: '1.0.0',
      enabled: true,
      tag: 'basic'
    })

    // Server-only actions (visible in DeskThing Web UI)
    DeskThing.registerAction({
      id: 'serverDiscover',
      name: '[SERVER] Discover Bridges',
      description: 'Run mDNS, SSDP, and N-UPnP discovery from the server',
      version: '1.0.0',
      enabled: true,
      tag: 'basic'
    })
    DeskThing.registerAction({
      id: 'serverPair',
      name: '[SERVER] Pair with Bridge IP',
      description: 'Trigger pairing loop for the IP in settings',
      version: '1.0.0',
      enabled: true,
      tag: 'basic'
    })

    DeskThing.tasks.add({
        id: 'setup-hue',
        version: '1.0.0',
        available: true,
        completed: !!(hueService.getConfig()?.bridgeIp && hueService.getConfig()?.appKey),
        label: 'Hue Bridge Setup',
        started: true,
        currentStep: 'step-1',
        description: 'Connect your Philips Hue Bridge to DeskThing.',
        steps: {
            'step-1': {
                id: 'step-1',
                type: STEP_TYPES.SETTING,
                completed: !!hueService.getConfig()?.bridgeIp,
                strict: true,
                label: 'Step 1: Enter Bridge IP',
                instructions: 'Enter your Philips Hue Bridge IP address manually (or use the Discover action below). Once set, it will unlock Step 2.',
                setting: {
                    id: 'bridgeIp',
                }
            },
            'step-2': {
                id: 'step-2',
                parentId: 'step-1', // Hidden until step-1 is completed
                type: STEP_TYPES.ACTION,
                completed: !!hueService.getConfig()?.appKey,
                strict: true,
                label: 'Step 2: Push Link Button',
                instructions: 'Now that the IP is set, press the physical link button on your Philips Hue Bridge, then immediately click the \'Pair\' action below within 30 seconds.',
                action: {
                    id: 'serverPair',
                    source: 'huething'
                }
            },
            'step-3': {
                id: 'step-3',
                parentId: 'step-2', // Hidden until pairing in step-2 is run successfully
                type: STEP_TYPES.SETTING,
                completed: !!hueService.getConfig()?.appKey,
                strict: false,
                label: 'Step 3: Confirm Authentication',
                instructions: 'Pairing completed! The App Key is filled automatically. You may skip this step.',
                setting: {
                    id: 'appKey',
                }
            }
        }
    })

    console.log('[HueThing] Registering keys...')
    // Register the volume knob as a key for brightness control
    DeskThing.registerKey('volumeKnob', 'Volume knob for brightness control', [
      EventMode.ScrollUp,
      EventMode.ScrollDown,
      EventMode.PressShort
    ], '1.0.0')

    // If already configured, start event stream
    if (hueService.isConfigured()) {
      console.log('[HueThing] Bridge configured, starting EventStream...')
      hueService.onUpdate((state) => {
        DeskThing.send({ type: 'hueState', payload: state })
      })
      hueService.startEventStream()
    }

    // Send initial state to clients
    console.log('[HueThing] Sending initial state...')
    await sendFullState()
    console.log('[HueThing] Startup complete!')
  } catch (err) {
    console.error('[HueThing] STARTUP ERROR:', err)
  }
}

function stop() {
  console.log('[HueThing] Stopping...')
  if (pairInterval) {
    clearInterval(pairInterval)
    pairInterval = null
  }
  hueService.stopEventStream()
}

function purge() {
  console.log('[HueThing] Purging data...')
  if (pairInterval) {
    clearInterval(pairInterval)
    pairInterval = null
  }
  hueService.stopEventStream()
}

// (Polling removed in favor of EventStream)

async function sendFullState() {
  try {
    const state = await hueService.fetchAllData()
    DeskThing.send({ type: 'hueState', payload: state })
    updateDynamicIcons(state)
  } catch (err) {
    const fallbackState = {
      connected: false,
      paired: false,
      bridgeIp: hueService.getConfig()?.bridgeIp || '',
      lights: [],
      rooms: [],
      scenes: []
    } as HueState
    DeskThing.send({ type: 'hueState', payload: fallbackState })
    updateDynamicIcons(fallbackState)
  }
}

function updateDynamicIcons(state: HueState) {
  // Update the Toggle All Lights icon dynamically based on the state
  const config = hueService.getConfig()
  if (!config?.bridgeIp || !config?.appKey || !state.connected) {
    DeskThing.updateIcon('toggleAllLights', '') // reset to default
    return
  }

  const anyOn = state.lights.some(l => l.on)
  
  // Example of using the DeskThing Links API to dynamically swap the icon SVGs rendered for actions on Car Thing
  if (anyOn) {
    DeskThing.updateIcon('toggleAllLights', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="var(--accent-hue, #bf5af2)" d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1zM10 20h4c0 1.1-.9 2-2 2s-2-.9-2-2z"/></svg>`)
  } else {
    DeskThing.updateIcon('toggleAllLights', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1zM10 20h4c0 1.1-.9 2-2 2s-2-.9-2-2z"/></svg>`)
  }
}

// ─── Client Message Handlers ────────────────────────────────────────

// Debug: Catch all data
DeskThing.on('data' as any, (data: any) => {
  console.log('[HueThing] RAW DATA received:', JSON.stringify(data))
})

// Get full state
DeskThing.on('getState', async () => {
  console.log('[HueThing] Received getState request')
  await sendFullState()
})

// Bridge discovery
DeskThing.on('discover', async () => {
  console.log('[HueThing] Received discover request')
  console.log('[HueController] Discovering Hue bridges...')
  const bridges = await hueService.discoverBridge()
  DeskThing.send({ type: 'hueDiscoverResult', payload: bridges })
})

let pairInterval: ReturnType<typeof setInterval> | null = null

async function startPairingProcess(bridgeIp: string) {
  console.log(`[HueController] Attempting to pair with bridge at ${bridgeIp}...`)
  
  // Clear any existing pairing loop
  if (pairInterval) clearInterval(pairInterval)

  // Start pairing loop (runs for max ~30 seconds)
  let attempts = 0
  const maxAttempts = 15

  const attemptPairing = async () => {
    attempts++
    const result = await hueService.pairBridge(bridgeIp)

    if (result.success) {
      if (pairInterval) clearInterval(pairInterval)
      DeskThing.saveData({
        bridgeIp,
        appKey: result.appKey!
      })
      console.log('[HueController] Bridge paired successfully!')
      
      // CRITICAL: Actually apply the new credentials to the HueService in memory!
      hueService.setConfig({ bridgeIp, appKey: result.appKey! })

      // Complete the DAG Steps formally so DeskThing knows this Task tree is valid
      DeskThing.steps.complete('setup-hue', 'step-1')
      DeskThing.steps.complete('setup-hue', 'step-2')
      DeskThing.steps.complete('setup-hue', 'step-3')
      DeskThing.tasks.complete('setup-hue')

      hueService.startEventStream()
      await sendFullState()
      DeskThing.send({ type: 'huePairStatus', payload: result })
    } else {
      // Check if it's the "link button not pressed" error
      if (result.error?.includes('link button')) {
        console.log(`[HueController] Waiting for link button press (Attempt ${attempts}/${maxAttempts})...`)
        if (attempts >= maxAttempts) {
          if (pairInterval) clearInterval(pairInterval)
          DeskThing.send({ type: 'huePairStatus', payload: { success: false, error: 'Pairing timed out. Please try again.' } })
        }
      } else {
        // Different error (e.g., connection refused), stop trying
        if (pairInterval) clearInterval(pairInterval)
        DeskThing.send({ type: 'huePairStatus', payload: result })
      }
    }
  }

  // Initial attempt
  await attemptPairing()

  // Polling every 2 seconds if not successful yet
  if (attempts < maxAttempts) {
    pairInterval = setInterval(attemptPairing, 2000)
  }
}

// Bridge pairing
DeskThing.on('pair', async (data: any) => {
  const bridgeIp = data?.payload?.bridgeIp
  if (!bridgeIp) {
    DeskThing.send({ type: 'huePairStatus', payload: { success: false, error: 'No bridge IP provided' } })
    return
  }
  await startPairingProcess(bridgeIp)
})

// Cancel pairing
DeskThing.on('cancelPairing', () => {
  if (pairInterval) {
    clearInterval(pairInterval)
    pairInterval = null
    console.log('[HueController] Pairing cancelled by client.')
  }
})

// Set bridge IP manually
DeskThing.on('setBridgeIp', async (data: any) => {
  const bridgeIp = data?.payload?.bridgeIp
  if (bridgeIp) {
    const config = hueService.getConfig()
    if (config?.appKey) {
      hueService.setConfig({ ...config, bridgeIp })
      DeskThing.saveData({ bridgeIp, appKey: config.appKey })
      hueService.startEventStream()
      await sendFullState()
    }
  }
})

// Set individual light state
DeskThing.on('setLight', async (data: any) => {
  const { lightId, ...state } = data?.payload || {}
  if (!lightId) return
  const success = await hueService.setLightState(lightId, state)
  if (success) {
    setTimeout(() => sendFullState(), 300)
  }
})

// Set light color (from Color Picker UI)
DeskThing.on('setLightColor', async (data: any) => {
  const { lightId, ...state } = data?.payload || {}
  if (!lightId) return
  // `state` will either contain { hue, saturation } OR { temperature }
  const success = await hueService.setLightColor(lightId, state)
  if (success) {
    setTimeout(() => sendFullState(), 300)
  }
})

// Set room (grouped light) state
DeskThing.on('setRoom', async (data: any) => {
  const { groupedLightId, ...state } = data?.payload || {}
  if (!groupedLightId) return
  const success = await hueService.setGroupedLightState(groupedLightId, state)
  if (success) {
    setTimeout(() => sendFullState(), 300)
  }
})

// Activate scene
DeskThing.on('activateScene', async (data: any) => {
  const sceneId = data?.payload?.sceneId
  if (!sceneId) return
  const success = await hueService.activateScene(sceneId)
  if (success) {
    setTimeout(() => sendFullState(), 500)
  }
})

// Toggle all lights
DeskThing.on('toggleAll', async (data: any) => {
  const on = data?.payload?.on ?? true
  await hueService.toggleAllLights(on)
  setTimeout(() => sendFullState(), 500)
})

// Handle settings changes from DeskThing UI
DeskThing.on('settings', async (data: any) => {
  const settings = data?.payload
  let needsSync = false

  const currentConfig = hueService.getConfig() || { bridgeIp: '', appKey: '' }
  const newConfig = { ...currentConfig }

  if (settings?.bridgeIp?.value !== undefined) {
    newConfig.bridgeIp = String(settings.bridgeIp.value)
    needsSync = true
    if (newConfig.bridgeIp) {
      DeskThing.steps.complete('setup-hue', 'step-1')
    }
  }
  if (settings?.appKey?.value !== undefined) {
    newConfig.appKey = String(settings.appKey.value)
    needsSync = true
    if (newConfig.appKey) {
      DeskThing.steps.complete('setup-hue', 'step-3')
    }
  }
  if (settings?.clientKey?.value !== undefined) {
    newConfig.clientKey = String(settings.clientKey.value)
    needsSync = true
  }

  if (needsSync) {
    console.log('[HueThing] Settings updated, reconfiguring...')
    hueService.setConfig(newConfig)
    DeskThing.saveData({ 
        bridgeIp: newConfig.bridgeIp, 
        appKey: newConfig.appKey,
        clientKey: newConfig.clientKey
    })

    // Auto-verify connection if both IP and Key are present
    if (newConfig.bridgeIp && newConfig.appKey) {
        hueService.startEventStream()
        await sendFullState()
        // Ensure steps 2 and 3 are marked complete if we magically got full auth
        DeskThing.steps.complete('setup-hue', 'step-2')
        DeskThing.steps.complete('setup-hue', 'step-3')
        DeskThing.tasks.complete('setup-hue')
    }
  }

  if (settings?.pollInterval?.value && typeof settings.pollInterval.value === 'number') {
    pollMs = settings.pollInterval.value
    DeskThing.saveData({ pollInterval: pollMs })
  }
  if (settings?.knobStep?.value && typeof settings.knobStep.value === 'number') {
    knobStep = settings.knobStep.value
    DeskThing.saveData({ knobStep })
  }
  if (settings?.iconColor?.value) {
    const color = String(settings.iconColor.value)
    const flair = color === 'white' ? '' : color
    DeskThing.updateIcon('toggleAllLights', flair)
    DeskThing.updateIcon('nextScene', flair)
    DeskThing.updateIcon('prevScene', flair)
    DeskThing.updateIcon('brightnessUp', flair)
    DeskThing.updateIcon('brightnessDown', flair)
  }
})

// Handle registered action triggers
DeskThing.on('action', async (data: any) => {
  const actionId = data?.payload?.id
  switch (actionId) {
    case 'serverDiscover': {
        console.log('[HueThing] Server-initiated discovery...')
        const bridges = await hueService.discoverBridge()
        console.log('[HueThing] Discovery results:', bridges)
        break
    }
    case 'serverPair': {
        const config = hueService.getConfig()
        if (config?.bridgeIp) {
            console.log(`[HueThing] Server-initiated pairing for ${config.bridgeIp}...`)
            await startPairingProcess(config.bridgeIp)
        } else {
            console.error('[HueThing] Cannot pair: No bridge IP configured in settings.')
        }
        break
    }
    case 'toggleAllLights': {
      const state = await hueService.fetchAllData()
      const anyOn = state.lights.some(l => l.on)
      await hueService.toggleAllLights(!anyOn)
      setTimeout(() => sendFullState(), 500)
      break
    }
    case 'nextScene':
    case 'prevScene': {
      const rooms = hueService.getRooms()
      const scenes = hueService.getScenes()
      for (const room of rooms) {
        if (room.sceneIds.length > 0) {
          const roomScenes = scenes.filter(s => s.roomId === room.id)
          if (roomScenes.length > 0) {
            const idx = actionId === 'nextScene' ? 0 : roomScenes.length - 1
            await hueService.activateScene(roomScenes[idx].id)
            setTimeout(() => sendFullState(), 500)
          }
          break
        }
      }
      break
    }
    case 'brightnessUp': {
      await adjustRoomBrightness(undefined, knobStep)
      break
    }
    case 'brightnessDown': {
      await adjustRoomBrightness(undefined, -knobStep)
      break
    }
  }
})

// Handle global key events (like the volume knob if mapped by the user)
DeskThing.on('key', async (data: any) => {
  const keyEvent = data?.payload
  if (keyEvent?.id === 'volumeKnob') {
    if (keyEvent.mode === EventMode.ScrollUp) {
      await adjustRoomBrightness(undefined, knobStep)
    } else if (keyEvent.mode === EventMode.ScrollDown) {
      await adjustRoomBrightness(undefined, -knobStep)
    } else if (keyEvent.mode === EventMode.PressShort) {
      const state = await hueService.fetchAllData()
      const anyOn = state.lights.some(l => l.on)
      await hueService.toggleAllLights(!anyOn)
      setTimeout(() => sendFullState(), 500)
    }
  }
})

// ─── Knob Brightness Handlers ───────────────────────────────────────

// Handle brightness knob from client (scroll up/down on Car Thing knob)
DeskThing.on('brightnessUp', async (data: any) => {
  const roomId = data?.payload?.roomId
  await adjustRoomBrightness(roomId, knobStep)
})

DeskThing.on('brightnessDown', async (data: any) => {
  const roomId = data?.payload?.roomId
  await adjustRoomBrightness(roomId, -knobStep)
})

// Knob press toggles all lights
DeskThing.on('knobPress', async () => {
  const state = await hueService.fetchAllData()
  const anyOn = state.lights.some(l => l.on)
  await hueService.toggleAllLights(!anyOn)
  setTimeout(() => sendFullState(), 500)
})

async function adjustRoomBrightness(roomId: string | undefined, delta: number) {
  const rooms = hueService.getRooms()
  // If a roomId is specified, adjust that room; otherwise adjust the first active room
  let targetRoom = roomId ? rooms.find(r => r.id === roomId) : rooms.find(r => r.on)
  if (!targetRoom && rooms.length > 0) targetRoom = rooms[0]
  if (!targetRoom?.groupedLightId) return

  const newBrightness = Math.max(1, Math.min(100, targetRoom.brightness + delta))
  const success = await hueService.setGroupedLightState(targetRoom.groupedLightId, {
    on: true,
    brightness: newBrightness
  })
  if (success) {
    // Send immediate feedback to client
    DeskThing.send({ type: 'hueBrightness', payload: { roomId: targetRoom.id, brightness: newBrightness } })
    setTimeout(() => sendFullState(), 300)
  }
}

// ─── Register Lifecycle Events ──────────────────────────────────────

DeskThing.on('start', startup)
DeskThing.on('stop', stop)
DeskThing.on('purge', purge)
