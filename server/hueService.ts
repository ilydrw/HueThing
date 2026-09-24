function debugLog(msg: string) {
  console.log(`[HueService] ${msg}`)
}

debugLog('hueService.ts module loading...')

import https from 'https'
import http from 'http'
import dgram from 'dgram'

// These are externalized and might fail in ESM if not handled carefully
let mDNS: any
let dtls: any

import {
  HueBridgeConfig,
  HueApiResponse,
  HueLight,
  HueRoom,
  HueGroupedLight,
  HueScene,
  SimplifiedLight,
  SimplifiedRoom,
  SimplifiedScene,
  HueState
} from './hueTypes.js'

async function loadExternalModules() {
  if (mDNS && dtls) return // Already loaded
  try {
    debugLog('[HueService] Loading multicast-dns...')
    const mDNSModule = await import('multicast-dns')
    mDNS = mDNSModule.default || mDNSModule
    debugLog('[HueService] multicast-dns loaded.')

    debugLog('[HueService] Loading node-dtls-client...')
    const dtlsModule = await import('node-dtls-client')
    dtls = dtlsModule.dtls || dtlsModule.default || dtlsModule
    debugLog('[HueService] node-dtls-client loaded.')
  } catch (err) {
    debugLog(`[HueService] FATAL: Failed to load external modules: ${err instanceof Error ? err.message : String(err)}`)
  }
}

// We'll call this in the constructor or discovery methods

const agent = new https.Agent({ rejectUnauthorized: false })
const clampBrightness = (value: number) => Math.max(1, Math.min(100, Math.round(value)))

export class HueService {
  private config: HueBridgeConfig | null = null
  private lights: SimplifiedLight[] = []
  private rooms: SimplifiedRoom[] = []
  private scenes: SimplifiedScene[] = []
  private groupedLights: Map<string, HueGroupedLight> = new Map()
  private eventSource: ReturnType<typeof https.request> | null = null
  private onStateUpdate: ((state: HueState) => void) | null = null
  private shouldReconnectEventStream = false
  private eventReconnectTimeout: ReturnType<typeof setTimeout> | null = null

  // Added a dedicated timeout reference for debouncing SSE events
  private sseRefreshTimeout: ReturnType<typeof setTimeout> | null = null
  dtlsSocket: any;

  constructor() {
    loadExternalModules().catch(e => debugLog(`[HueService] Async load error: ${e}`))
  }

  setConfig(config: HueBridgeConfig) {
    this.config = config
  }

  getConfig() {
    return this.config
  }

  onUpdate(callback: (state: HueState) => void) {
    this.onStateUpdate = callback
  }

  isConfigured(): boolean {
    return !!(this.config?.bridgeIp && this.config?.appKey)
  }

  async discoverBridge(): Promise<string[]> {
    await loadExternalModules()
    debugLog('[HueService] Starting discovery...')
    const bridges = new Set<string>()

    try {
      console.log('[HueService] Attempting N-UPnP cloud discovery...')
      const response = await this.httpGet('https://discovery.meethue.com')
      if (response && response.trim()) {
        const upnpBridges = JSON.parse(response)
        if (Array.isArray(upnpBridges)) {
          upnpBridges.forEach((b: { internalipaddress: string }) => bridges.add(b.internalipaddress))
        }
      }
    } catch (err) {
      console.error('[HueService] N-UPnP discovery failed:', err)
    }

    try {
      console.log('[HueService] Starting local discovery (mDNS + SSDP)...')
      const [mdnsRes, ssdpRes] = await Promise.all([
        this.discoverViaMDNS().catch(e => { console.error('[HueService] mDNS failed:', e); return [] }),
        this.discoverViaSSDP().catch(e => { console.error('[HueService] SSDP failed:', e); return [] })
      ])

      mdnsRes.forEach(ip => bridges.add(ip))
      ssdpRes.forEach(ip => bridges.add(ip))
    } catch (err) {
      console.error('[HueService] Local discovery failure:', err)
    }

    const candidates = Array.from(bridges)
    if (candidates.length === 0) {
      console.log('[HueService] No potential bridges found.')
      return []
    }

    console.log(`[HueService] Found ${candidates.length} potential bridges. Verifying...`)
    const verifiedBridges: string[] = []

    await Promise.all(candidates.map(async (ip) => {
      try {
        debugLog(`[HueService] Candidate: ${ip}. Verifying...`)
        const isHue = await this.verifyBridge(ip)
        if (isHue) {
          debugLog(`[HueService] VERIFIED: ${ip} is a Hue Bridge`)
          verifiedBridges.push(ip)
        } else {
          debugLog(`[HueService] REJECTED: ${ip} did not respond as a Hue Bridge`)
        }
      } catch (err) {
        debugLog(`[HueService] Verification failed for ${ip}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }))

    console.log(`[HueService] Discovery finished. Verified bridges:`, verifiedBridges)
    return verifiedBridges
  }

  private async verifyBridge(ip: string): Promise<boolean> {
    return new Promise((resolve) => {
      const url = `http://${ip}/description.xml`
      const options = { timeout: 3000 }

      const req = http.get(url, options, (res) => {
        console.log(`[HueService] Verify ${ip}: Status ${res.statusCode}`)
        if (res.statusCode !== 200) {
          console.error(`[HueService] Verify ${ip}: Unexpected status ${res.statusCode}`)
          res.resume()
          resolve(false)
          return
        }
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          const isHue = data.toLowerCase().includes('philips hue bridge') ||
            data.toLowerCase().includes('philips-hue')
          if (!isHue) console.log(`[HueService] Verify ${ip}: Description did not match Hue. Content snippet: ${data.substring(0, 100)}`)
          resolve(isHue)
        })
      })

      req.on('error', (err) => {
        console.log(`[HueService] Verify ${ip}: Network error: ${err.message}`)
        resolve(false)
      })
      req.on('timeout', () => {
        console.log(`[HueService] Verify ${ip}: Timed out after 2000ms`)
        req.destroy()
        resolve(false)
      })
    })
  }

  private discoverViaMDNS(): Promise<string[]> {
    return new Promise((resolve) => {
      if (!mDNS) {
        debugLog('[HueService] mDNS module not loaded, skipping...')
        resolve([])
        return
      }
      const mdns = (mDNS as any)()
      const bridges = new Set<string>()

      console.log('[HueService] Searching mDNS...')

      mdns.on('response', (response: any) => {
        const records = [...(response.answers || []), ...(response.additionals || [])]

        records.forEach((record: any) => {
          if (record.type === 'A') {
            bridges.add(record.data)
          }
        })
      })

      mdns.query({
        questions: [
          { name: '_hue._tcp.local', type: 'PTR' },
          { name: '_philips-hue._tcp.local', type: 'PTR' }
        ]
      })

      setTimeout(() => {
        mdns.destroy()
        resolve(Array.from(bridges))
      }, 5000)
    })
  }

  private discoverViaSSDP(): Promise<string[]> {
    return new Promise((resolve) => {
      const bridges = new Set<string>()
      const client = dgram.createSocket('udp4')

      const query = Buffer.from(
        'M-SEARCH * HTTP/1.1\r\n' +
        'HOST: 239.255.255.250:1900\r\n' +
        'MAN: "ssdp:discover"\r\n' +
        'MX: 3\r\n' +
        'ST: ssdp:all\r\n' +
        '\r\n'
      )

      client.on('message', (msg, rinfo) => {
        const response = msg.toString()
        console.log(`[HueService] SSDP Candidate: ${rinfo.address}`)
        if (response.toLowerCase().includes('hue') || response.toLowerCase().includes('philips')) {
          bridges.add(rinfo.address)
        }
      })

      client.on('error', (err) => {
        console.error('[HueService] SSDP Error:', err)
      })

      console.log('[HueService] Sending SSDP M-SEARCH...')
      client.send(query, 0, query.length, 1900, '239.255.255.250')

      setTimeout(() => {
        client.close()
        resolve(Array.from(bridges))
      }, 5000)
    })
  }

  // ─── Bridge Pairing ──────────────────────────────────────────────

  async pairBridge(bridgeIp: string): Promise<{ success: boolean; appKey?: string; clientKey?: string; error?: string }> {
    try {
      const body = JSON.stringify({
        devicetype: 'deskthing_hue#carthing',
        generateclientkey: true
      })

      debugLog(`[HueService] Pairing attempt with ${bridgeIp}...`)
      const response = await this.httpPost(`http://${bridgeIp}/api`, body)
      debugLog(`[HueService] Raw pairing response from ${bridgeIp}: ${response}`)
      const result = JSON.parse(response)

      if (Array.isArray(result) && result[0]) {
        if (result[0].success) {
          const appKey = result[0].success.username
          const clientKey = result[0].success.clientkey
          this.config = { bridgeIp, appKey, clientKey }
          debugLog(`[HueService] Pairing SUCCESS for ${bridgeIp}. Key saved.`)
          return { success: true, appKey, clientKey }
        }
        if (result[0].error) {
          debugLog(`[HueService] Pairing REJECTED for ${bridgeIp}: ${result[0].error.description}`)
          return { success: false, error: result[0].error.description }
        }
      }
      debugLog(`[HueService] Pairing FAILED for ${bridgeIp}: Unexpected response format`)
      return { success: false, error: 'Unexpected response from bridge' }
    } catch (err) {
      debugLog(`[HueService] Pairing ERROR for ${bridgeIp}: ${err}`)
      return { success: false, error: `Connection failed: ${err}` }
    }
  }





  async fetchAllData(): Promise<HueState> {
    if (!this.isConfigured()) {
      return {
        connected: false,
        paired: false,
        bridgeIp: this.config?.bridgeIp || '',
        lights: [],
        rooms: [],
        scenes: []
      }
    }

    try {
      const [lightsRaw, roomsRaw, zonesRaw, groupedRaw, scenesRaw, devicesRaw, entAreaRaw, bridgeHomeRaw] = await Promise.all([
        this.tryApiGet<HueLight>('/clip/v2/resource/light'),
        this.tryApiGet<HueRoom>('/clip/v2/resource/room'),
        this.tryApiGet<any>('/clip/v2/resource/zone'),
        this.tryApiGet<HueGroupedLight>('/clip/v2/resource/grouped_light'),
        this.tryApiGet<HueScene>('/clip/v2/resource/scene'),
        this.tryApiGet<any>('/clip/v2/resource/device'),
        this.tryApiGet<any>('/clip/v2/resource/entertainment_area'),
        this.tryApiGet<any>('/clip/v2/resource/bridge_home')
      ])

      console.log(`[HueService] 🔍 V2 Diagnostics: Lights:${lightsRaw.length}, Rooms:${roomsRaw.length}, Zones:${zonesRaw.length}, Scenes:${scenesRaw.length}, Devices:${devicesRaw.length}`)

      const displayGroups = [...roomsRaw, ...zonesRaw]
      const membershipGroups = [...displayGroups, ...entAreaRaw, ...bridgeHomeRaw]
      console.log(`[HueService] 🔍 Discovery Diagnostic: V2 Lights: ${lightsRaw.length}, V2 Rooms: ${roomsRaw.length}, V2 Zones: ${zonesRaw.length}, V2 Entertainment: ${entAreaRaw.length}, V2 BridgeHome: ${bridgeHomeRaw.length}`)
      console.log('[HueService] V2 Groups IDs:', membershipGroups.map(g => `${g.metadata?.name} (${g.id})`).join(', '))

      this.groupedLights.clear()
      for (const gl of groupedRaw) {
        this.groupedLights.set(gl.id, gl)
      }

      const deviceToRoom = new Map<string, string>()
      for (const room of roomsRaw) {
        if (!room.children) {
          console.log(`[HueService] ⚠️ Group "${room.metadata?.name}" has NO children service list!`)
          continue
        }
        for (const child of room.children) {
          if (child.rtype === 'device' || child.rtype === 'light') {
            deviceToRoom.set(child.rid, room.id)
          }
        }
      }

      const lightOwnerById = new Map(lightsRaw.map((light) => [light.id, light.owner.rid]))

      const deviceMetadata = new Map<string, { archetype: string; modelId: string; isBle: boolean }>()
      for (const d of devicesRaw) {
        const archetype = d.metadata?.archetype || 'bulb'
        const modelId = d.product_data?.model_id || 'unknown'
        const isBle = modelId.startsWith('LCA') || modelId.startsWith('LCW') || modelId.startsWith('LCT02')
        deviceMetadata.set(d.id, { archetype, modelId, isBle })
      }

      this.lights = lightsRaw.map((light): SimplifiedLight => {
        const device = devicesRaw.find(d => d.id === light.owner.rid);
        const roomId = deviceToRoom.get(light.owner.rid) || deviceToRoom.get(light.id);
        if (!roomId) console.log(`[HueService] ❓ Light "${light.metadata.name}" has no roomId mapping! Owner rid: ${light.owner.rid}, light id: ${light.id}`)

        const metadata = deviceMetadata.get(light.owner.rid);
        const matchingRoom = roomId ? roomsRaw.find(r => r.id === roomId) : undefined;
        const roomName = (matchingRoom as any)?.metadata?.name || 'Unassigned';

        return {
          id: light.id,
          id_v1: light.id_v1,
          name: light.metadata.name,
          on: light.on.on,
          brightness: light.dimming?.brightness ?? 100,
          colorXY: light.color?.xy,
          colorTemp: light.color_temperature?.mirek ?? undefined,
          colorTempRange: light.color_temperature?.mirek_schema
            ? { min: light.color_temperature.mirek_schema.mirek_minimum, max: light.color_temperature.mirek_schema.mirek_maximum }
            : undefined,
          hasColor: !!light.color,
          hasColorTemp: !!light.color_temperature,
          roomId,
          roomName,
          archetype: metadata?.archetype || 'bulb',
          modelId: metadata?.modelId,
          isBle: metadata?.isBle
        };
      });

      this.rooms = displayGroups.map((room): SimplifiedRoom => {
        const groupedLightService = room.services?.find((s: any) => s.rtype === 'grouped_light')
        const gl = groupedLightService ? this.groupedLights.get(groupedLightService.rid) : undefined
        const memberIds = new Set((room.children || []).map((child: any) => child.rid))
        const roomLights = this.lights.filter((light) => (
          memberIds.has(light.id) || memberIds.has(lightOwnerById.get(light.id))
        ))
        const roomScenes = scenesRaw.filter(s => s.group?.rid === room.id).map(s => s.id)

        console.log(`[HueService] 📦 Processing V2 Room: "${room.metadata?.name}" with ${roomLights.length} lights`)

        return {
          id: room.id,
          name: room.metadata?.name || 'Unknown Room',
          archetype: room.metadata?.archetype || 'other',
          groupedLightId: groupedLightService?.rid,
          on: gl?.on?.on ?? roomLights.some(l => l.on),
          brightness: gl?.dimming?.brightness ?? 100,
          lightIds: roomLights.map(l => l.id),
          sceneIds: roomScenes
        }
      })

      // --- AGGRESSIVE DISCOVERY & MERGE ---
      // We always attempt V1 fallback to ensure nothing is missed, then merge by name
      console.log('[HueService] ☢️ NUCLEAR V1 fallback for missing room recovery...')
      try {
        const v1Groups = await this.tryV1Get<any>('groups')
        if (v1Groups && typeof v1Groups === 'object') {
          console.log(`[HueService] 🔍 V1 Groups Found Count: ${Object.keys(v1Groups).length}`)
          for (const [v1Id, group] of Object.entries(v1Groups)) {
            console.log(`[HueService] 🔍 V1 Group Audit: "${group.name}" (Type: ${group.type}, Lights: ${group.lights?.length || 0})`)

            const existingIndex = this.rooms.findIndex(r =>
              r.name.toLowerCase() === group.name.toLowerCase() ||
              r.id === `v1-group-${v1Id}`
            )

            // Map V1 light IDs to V2 UUIDs
            const mappedV2LightIds = (group.lights || []).map((v1IdStr: string) => {
              const light = this.lights.find(l => l.id_v1?.endsWith(`/${v1IdStr}`) || l.id.includes(v1IdStr))
              return light?.id || `v1-light-${v1IdStr}`
            })

            const roomData: SimplifiedRoom = {
              id: `v1-group-${v1Id}`,
              name: group.name,
              archetype: (group.class || group.type)?.toLowerCase() || 'other',
              on: group.state?.any_on ?? false,
              brightness: group.action?.bri ? Math.round((group.action.bri / 254) * 100) : 100,
              lightIds: mappedV2LightIds,
              sceneIds: [],
              v1GroupId: v1Id
            }

            if (existingIndex >= 0) {
              const existing = this.rooms[existingIndex]
              existing.lightIds = Array.from(new Set([...existing.lightIds, ...mappedV2LightIds]))
              if (!existing.v1GroupId) existing.v1GroupId = v1Id
            } else {
              this.rooms.push(roomData)
            }

            // Map orphan lights
            group.lights?.forEach((v1IdStr: string) => {
              const light = this.lights.find(l => l.id.includes(v1IdStr) || l.id_v1?.endsWith(`/${v1IdStr}`))
              if (light && !light.roomId) {
                light.roomId = roomData.id
                light.roomName = group.name
              }
            })
          }
        }

        // V1 LIGHT FALLBACK: If we still have very few lights, pull them from V1 directly
        if (this.lights.length < 5) {
          console.log('[HueService] ☢️ NUCLEAR V1 fallback for lights...')
          const v1Lights = await this.tryV1Get<any>('lights')
          for (const [v1Id, l] of Object.entries(v1Lights)) {
            if (!this.lights.some(dl => dl.id_v1?.endsWith(`/${v1Id}`) || dl.id.includes(v1Id))) {
              this.lights.push({
                id: `v1-light-${v1Id}`,
                id_v1: `/lights/${v1Id}`,
                name: l.name,
                on: l.state?.on ?? false,
                brightness: l.state?.bri ? Math.round((l.state.bri / 254) * 100) : 100,
                hasColor: !!l.state?.xy,
                hasColorTemp: !!l.state?.ct,
                archetype: l.config?.archetype || 'bulb',
                modelId: l.modelid
              })
            }
          }
        }
      } catch (v1Err) {
        console.error('[HueService] ❌ V1 Fallback failed:', v1Err)
      }

      this.scenes = scenesRaw.map((scene): SimplifiedScene => ({
        id: scene.id,
        name: scene.metadata.name,
        roomId: scene.group?.rid || '',
        colors: scene.palette?.color?.map(c => ({
          x: c.color.xy.x,
          y: c.color.xy.y,
          brightness: c.dimming.brightness
        })) ?? [],
        isDynamic: scene.status?.active === 'dynamic'
      }))

      console.log(`[HueService] 🏁 Discovery Finished. Total Rooms: ${this.rooms.length}, Lights: ${this.lights.length}, Scenes: ${this.scenes.length}`)

      return {
        connected: true,
        paired: true,
        bridgeIp: this.config!.bridgeIp,
        lights: this.lights,
        rooms: this.rooms,
        scenes: this.scenes
      }
    } catch (err) {
      console.error('[HueService] Fatal error in fetchAllData:', err)
      throw err
    }
  }

  // ─── Real-time Updates (SSE) ─────────────────────────────────────

  async startEventStream() {
    if (!this.config) return

    this.shouldReconnectEventStream = true
    if (this.eventReconnectTimeout) {
      clearTimeout(this.eventReconnectTimeout)
      this.eventReconnectTimeout = null
    }
    if (this.eventSource) return

    const url = `https://${this.config.bridgeIp}/eventstream/clip/v2`
    console.log(`[HueService] Opening EventStream: ${url}`)

    try {
      const options: https.RequestOptions = {
        agent,
        method: 'GET',
        headers: {
          'hue-application-key': this.config.appKey,
          'Accept': 'text/event-stream'
        },
        timeout: 0
      }

      this.eventSource = https.request(url, options, (res) => {
        console.log(`[HueService] EventStream connected: ${res.statusCode}`)
        if (res.statusCode && res.statusCode >= 400) {
          console.error(`[HueService] EventStream rejected: ${res.statusCode}`)
          res.resume()
          this.scheduleEventStreamReconnect()
          return
        }

        let buffer = ''
        res.on('data', (chunk) => {
          buffer += chunk.toString()

          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            this.handleEvent(part)
          }
        })

        res.on('error', (err) => {
          console.error('[HueService] EventStream response error:', err)
          this.scheduleEventStreamReconnect()
        })

        res.on('close', () => {
          console.log('[HueService] EventStream closed.')
          this.scheduleEventStreamReconnect()
        })
      })

      this.eventSource.on('error', (err) => {
        console.error('[HueService] EventStream request error:', err)
        this.scheduleEventStreamReconnect()
      })

      this.eventSource.end()
    } catch (err) {
      console.error('[HueService] Failed to start EventStream:', err)
      this.scheduleEventStreamReconnect()
    }
  }

  stopEventStream() {
    this.shouldReconnectEventStream = false
    if (this.eventReconnectTimeout) {
      clearTimeout(this.eventReconnectTimeout)
      this.eventReconnectTimeout = null
    }
    if (this.sseRefreshTimeout) {
      clearTimeout(this.sseRefreshTimeout)
      this.sseRefreshTimeout = null
    }
    if (this.eventSource) {
      this.eventSource.destroy()
      this.eventSource = null
    }
  }

  private scheduleEventStreamReconnect() {
    if (!this.shouldReconnectEventStream || this.eventReconnectTimeout) return

    if (this.eventSource) {
      this.eventSource.destroy()
      this.eventSource = null
    }

    this.eventReconnectTimeout = setTimeout(() => {
      this.eventReconnectTimeout = null
      if (this.shouldReconnectEventStream) {
        this.startEventStream()
      }
    }, 5000)
  }

  private async handleEvent(eventData: string) {
    try {
      const lines = eventData.split('\n')
      const dataLine = lines.find(l => l.startsWith('data: '))
      if (!dataLine) return

      const jsonStr = dataLine.substring(6)
      const events = JSON.parse(jsonStr)

      if (!Array.isArray(events)) return

      let needsRefresh = false
      for (const event of events) {
        if (event.type === 'update' || event.type === 'add' || event.type === 'delete') {
          needsRefresh = true
          break
        }
      }

      // Debounce the fetch trigger so slider movements don't crash the bridge
      if (needsRefresh && this.onStateUpdate) {
        if (this.sseRefreshTimeout) clearTimeout(this.sseRefreshTimeout)

        this.sseRefreshTimeout = setTimeout(async () => {
          try {
            console.log('[HueService] Debounced SSE state change. Fetching fresh data...')
            const newState = await this.fetchAllData()
            if (this.onStateUpdate) this.onStateUpdate(newState)
          } catch (refreshErr) {
            console.error('[HueService] Failed to refresh state after SSE update:', refreshErr)
          }
        }, 400) // 400ms is a safe window for a human to finish moving a slider
      }
    } catch (err) {
      // Squelch JSON parse errors from malformed chunks
    }
  }




  // ─── Resource Getters ────────────────────────────────────────────

  getLights() { return this.lights }
  getRooms() { return this.rooms }
  getScenes() { return this.scenes }

  // ─── Light & Group Control ───────────────────────────────────────

  async setLightState(lightId: string, state: {
    on?: boolean
    brightness?: number
    colorXY?: { x: number; y: number }
    colorTemp?: number
  }): Promise<boolean> {
    if (lightId.startsWith('v1-light-')) {
      const v1Id = lightId.replace('v1-light-', '')
      const v1Body: any = {}
      if (state.on !== undefined) v1Body.on = state.on
      if (state.brightness !== undefined) v1Body.bri = Math.round((clampBrightness(state.brightness) / 100) * 254)
      if (state.colorXY) v1Body.xy = [state.colorXY.x, state.colorXY.y]
      if (state.colorTemp !== undefined) v1Body.ct = state.colorTemp
      return this.httpPutV1(`/lights/${v1Id}/state`, v1Body)
    }

    const body: Record<string, any> = {}
    if (state.on !== undefined) body.on = { on: state.on }
    if (state.brightness !== undefined) body.dimming = { brightness: clampBrightness(state.brightness) }
    if (state.colorXY) body.color = { xy: state.colorXY }
    if (state.colorTemp !== undefined) body.color_temperature = { mirek: state.colorTemp }

    return this.apiPut(`/clip/v2/resource/light/${lightId}`, body)
  }

  async setLightColor(lightId: string, state: { hue?: number; saturation?: number; temperature?: number }): Promise<boolean> {
    if (lightId.startsWith('v1-light-')) {
      const v1Id = lightId.replace('v1-light-', '')
      const v1Body: any = {}
      if (state.temperature !== undefined) v1Body.ct = state.temperature
      if (state.hue !== undefined) v1Body.hue = Math.round((state.hue / 360) * 65535)
      if (state.saturation !== undefined) v1Body.sat = Math.round((state.saturation / 100) * 254)
      return this.httpPutV1(`/lights/${v1Id}/state`, v1Body)
    }

    const body: Record<string, any> = {}

    if (state.temperature !== undefined) {
      body.color_temperature = { mirek: state.temperature }
    } else if (state.hue !== undefined && state.saturation !== undefined) {
      const xy = this.hsvToXy(state.hue, state.saturation)
      body.color = { xy }
    }

    return this.apiPut(`/clip/v2/resource/light/${lightId}`, body)
  }



  private hsvToXy(h: number, s: number): { x: number; y: number } {
    h = h / 360
    s = s / 100
    const v = 1.0

    let r = 0, g = 0, b = 0
    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)

    switch (i % 6) {
      case 0: r = v, g = t, b = p; break
      case 1: r = q, g = v, b = p; break
      case 2: r = p, g = v, b = t; break
      case 3: r = p, g = q, b = v; break
      case 4: r = t, g = p, b = v; break
      case 5: r = v, g = p, b = q; break
    }

    const rL = (r > 0.04045) ? Math.pow((r + 0.055) / (1.0 + 0.055), 2.4) : (r / 12.92)
    const gL = (g > 0.04045) ? Math.pow((g + 0.055) / (1.0 + 0.055), 2.4) : (g / 12.92)
    const bL = (b > 0.04045) ? Math.pow((b + 0.055) / (1.0 + 0.055), 2.4) : (b / 12.92)

    const X = rL * 0.664511 + gL * 0.154324 + bL * 0.162028
    const Y = rL * 0.283881 + gL * 0.668433 + bL * 0.047685
    const Z = rL * 0.000088 + gL * 0.072310 + bL * 0.986039

    let x = (X / (X + Y + Z)) || 0
    let y = (Y / (X + Y + Z)) || 0

    x = isNaN(x) ? 0 : x
    y = isNaN(y) ? 0 : y

    return { x, y }
  }

  async setGroupedLightState(room: SimplifiedRoom, state: {
    on?: boolean
    brightness?: number
  }): Promise<boolean> {
    const body: Record<string, any> = {}
    if (state.on !== undefined) body.on = { on: state.on }
    if (state.brightness !== undefined) body.dimming = { brightness: clampBrightness(state.brightness) }

    // Prefer V2 if available
    if (room.groupedLightId) {
      return this.apiPut(`/clip/v2/resource/grouped_light/${room.groupedLightId}`, body)
    }

    // Fallback to V1 group control
    if (room.v1GroupId) {
      const v1Body: Record<string, any> = {}
      if (state.on !== undefined) v1Body.on = state.on
      if (state.brightness !== undefined) v1Body.bri = Math.round((clampBrightness(state.brightness) / 100) * 254)

      try {
        await this.httpPut(`http://${this.config!.bridgeIp}/api/${this.config!.appKey}/groups/${room.v1GroupId}/action`, JSON.stringify(v1Body))
        return true
      } catch (err) {
        console.error('[HueService] V1 Group Put failed:', err)
        return false
      }
    }

    return false
  }

  async activateScene(sceneId: string): Promise<boolean> {
    const body = { recall: { action: 'active' } }
    return this.apiPut(`/clip/v2/resource/scene/${sceneId}`, body)
  }

  async toggleAllLights(on: boolean): Promise<boolean> {
    const v2Requests = Array.from(this.groupedLights.values()).map(gl =>
      this.apiPut(`/clip/v2/resource/grouped_light/${gl.id}`, { on: { on } })
    )
    const v1Requests = this.rooms
      .filter((room) => !room.groupedLightId && room.v1GroupId)
      .map((room) => this.setGroupedLightState(room, { on }))
    const promises = [...v2Requests, ...v1Requests]
    if (promises.length === 0) return false
    const results = await Promise.all(promises)
    return results.every(r => r)
  }

  // ─── Entertainment & Sync (DTLS) ─────────────────────────────────

  async getSyncAreas() {
    const entertainmentAreas = await this.tryApiGet<any>('/clip/v2/resource/entertainment_area');
    const rawLights = await this.tryApiGet<HueLight>('/clip/v2/resource/light');
    const v1LightIds = new Map(rawLights.map((light) => [light.id, light.id_v1]));

    return entertainmentAreas.map(area => ({
      id: area.id,
      name: area.metadata.name,
      // Sync requires specific light positions
      locations: area.locations?.service_locations?.map((loc: any) => ({
        lightId: v1LightIds.get(loc.service.rid) || loc.service.rid,
        position: loc.position // {x, y, z}
      })) || []
    }));
  }


  async startSync(areaId: string): Promise<boolean> {
    await loadExternalModules()
    if (!dtls) {
      debugLog('[HueService] node-dtls-client not loaded, cannot start sync')
      return false
    }
    if (!this.config || !this.config.clientKey) {
      console.error('[HueService] Missing ClientKey for DTLS handshake');
      return false;
    }

    // 1. Tell the Bridge via HTTPS to open the UDP stream port
    const started = await this.apiPut(`/clip/v2/resource/entertainment_area/${areaId}`, {
      action: 'start'
    });

    if (!started) {
      debugLog('[HueService] Failed to start entertainment area on bridge via API');
      return false;
    }

    // 2. Establish the DTLS Socket
    this.dtlsSocket = dtls.createSocket({
      type: 'udp4',
      address: this.config.bridgeIp,
      port: 2100,
      psk: { [this.config.appKey]: Buffer.from(this.config.clientKey, 'hex').toString('hex') },
      ciphers: ['TLS_PSK_WITH_AES_128_GCM_SHA256'],
      timeout: 5000
    });

    this.dtlsSocket.on('connected', () => debugLog('[HueService] Sync Socket Connected'));
    this.dtlsSocket.on('error', (e: Error) => console.error('[HueService] Sync Socket Error:', e));
    this.dtlsSocket.on('close', () => debugLog('[HueService] Sync Socket Closed'));
    this.dtlsSocket.on('timeout', () => console.error('[HueService] Sync Socket Timeout'));

    return true;
  }

  /**
   * Streams light data. This must be called at a high frequency (e.g., 25-50fps)
   *
   */
  sendSyncData(lightUpdates: { id: number, color: { r: number, g: number, b: number } }[]) {
    if (!this.dtlsSocket) return;

    // Hue Entertainment Protocol V1 Header
    const header = Buffer.from([
      0x48, 0x75, 0x65, 0x53, 0x74, 0x72, 0x65, 0x61, 0x6d, // "HueStream"
      0x01, 0x00, // Version 1.0
      0x00,       // Sequence (ignored)
      0x00, 0x00, // Reserved
      0x00,       // Color Mode: RGB
      0x00        // Reserved
    ]);

    // Data payload (Each light is 9 bytes: Type(1), ID(2), R(2), G(2), B(2))
    const payload = Buffer.alloc(lightUpdates.length * 9);
    lightUpdates.forEach((update, i) => {
      const offset = i * 9;
      const toHueChannel = (value: number) => {
        const normalized = value <= 255 ? Math.round((Math.max(0, value) / 255) * 65535) : Math.round(value)
        return Math.max(0, Math.min(65535, normalized))
      }
      payload.writeUInt8(0x00, offset); // Type: Light
      payload.writeUInt16BE(update.id, offset + 1); // V1 Light ID
      payload.writeUInt16BE(toHueChannel(update.color.r), offset + 3);
      payload.writeUInt16BE(toHueChannel(update.color.g), offset + 5);
      payload.writeUInt16BE(toHueChannel(update.color.b), offset + 7);
    });

    this.dtlsSocket.send(Buffer.concat([header, payload]));
  }

  stopSync(areaId: string) {
    if (this.dtlsSocket) {
      this.dtlsSocket.close();
      this.dtlsSocket = null;
    }
    this.apiPut(`/clip/v2/resource/entertainment_area/${areaId}`, { action: 'stop' });
  }

  /**
   * Runs a diagnostic check to ensure the environment is ready for DTLS Streaming
   */
  async debugSyncReady(areaId: string): Promise<{ ready: boolean; reason?: string }> {
    // 1. Check for Client Key
    if (!this.config?.clientKey) {
      return { ready: false, reason: 'Missing Client Key. Please re-pair your Bridge.' };
    }

    // 2. Test UDP Port 2100 reachability
    const isPortOpen = await this.testUdpPort(this.config.bridgeIp, 2100);
    if (!isPortOpen) {
      return { ready: false, reason: 'UDP Port 2100 is blocked. Check your Firewall.' };
    }

    // 3. Verify the Area exists and is a V2 resource
    try {
      const area = await this.tryApiGet<any>(`/clip/v2/resource/entertainment_area/${areaId}`);
      if (!area || area.length === 0) {
        return { ready: false, reason: 'Entertainment Area not found.' };
      }
    } catch (e) {
      return { ready: false, reason: 'Bridge rejected Area lookup.' };
    }

    return { ready: true };
  }

  private testUdpPort(ip: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const client = dgram.createSocket('udp4');
      const timeout = setTimeout(() => {
        client.close();
        resolve(false);
      }, 2000);

      // We send an empty buffer just to see if the stack throws an immediate unreachable error
      client.send(Buffer.alloc(0), port, ip, (err) => {
        clearTimeout(timeout);
        client.close();
        resolve(!err);
      });
    });
  }




  // ─── Internal HTTP Utilities ─────────────────────────────────────

  private async tryApiGet<T>(path: string): Promise<T[]> {
    try {
      const results = await this.apiGet<T>(path)
      console.log(`[HueService]   ✅ Fetched ${path}: ${results.length} items`)
      return results
    } catch (err) {
      console.error(`[HueService]   ❌ Failed to fetch ${path}:`, err instanceof Error ? err.message : String(err))
      return []
    }
  }

  private async tryV1Get<T>(path: string): Promise<Record<string, T>> {
    if (!this.config) return {}
    try {
      const url = `http://${this.config.bridgeIp}/api/${this.config.appKey}/${path}`
      const response = await this.httpGet(url)
      const parsed = JSON.parse(response)
      return (typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {}
    } catch (err) {
      console.error(`[HueService] V1 Get failed for ${path}:`, err)
      return {}
    }
  }

  private async httpPutV1(path: string, body: any): Promise<boolean> {
    if (!this.config) return false
    try {
      const url = `http://${this.config.bridgeIp}/api/${this.config.appKey}${path}`
      await this.httpPut(url, JSON.stringify(body))
      return true
    } catch (err) {
      console.error(`[HueService] V1 PUT failed for ${path}:`, err)
      return false
    }
  }

  private httpPut(url: string, body: string): Promise<string> {
    return this.httpRequest(url, 'PUT', body, { 'Content-Type': 'application/json' })
  }

  private async apiGet<T>(path: string): Promise<T[]> {
    if (!this.config) throw new Error('Not configured')
    const url = `https://${this.config.bridgeIp}${path}`
    const response = await this.httpGetWithAuth(url)
    const parsed: HueApiResponse<T> = JSON.parse(response)
    if (parsed.errors?.length) {
      console.error('Hue API errors:', parsed.errors)
    }
    return parsed.data ?? []
  }

  private async apiPut(path: string, body: Record<string, any>): Promise<boolean> {
    if (!this.config) throw new Error('Not configured')
    const url = `https://${this.config.bridgeIp}${path}`
    try {
      const response = await this.httpRequest(url, 'PUT', JSON.stringify(body), {
        'hue-application-key': this.config.appKey,
        'Content-Type': 'application/json'
      })
      const parsed = JSON.parse(response)
      return !(parsed.errors?.length > 0)
    } catch (err) {
      console.error(`Hue PUT failed for ${path}:`, err)
      return false
    }
  }

  private httpGetWithAuth(url: string): Promise<string> {
    return this.httpRequest(url, 'GET', undefined, {
      'hue-application-key': this.config!.appKey,
      'Accept': 'application/json'
    })
  }

  private httpGet(url: string): Promise<string> {
    return this.httpRequest(url, 'GET', undefined, {
      'Accept': 'application/json'
    })
  }

  private httpPost(url: string, body: string): Promise<string> {
    return this.httpRequest(url, 'POST', body, { 'Content-Type': 'application/json' })
  }

  private httpRequest(
    url: string,
    method: string,
    body?: string,
    headers?: Record<string, string>,
    timeoutMs: number = 5000
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url)
      const isHttps = parsedUrl.protocol === 'https:'
      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        agent: isHttps ? agent : undefined,
        headers: {
          ...headers,
          ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {})
        },
        timeout: timeoutMs
      }

      const protocol = isHttps ? https : http
      debugLog(`[HueService] HttpRequest ${method} to ${url}`)

      const req = protocol.request(options, (res: any) => {
        debugLog(`[HueService] Response from ${url}: ${res.statusCode}`)
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => {
          debugLog(`[HueService] Finished request to ${url} (length: ${data.length})`)
          resolve(data)
        })
      })

      req.on('timeout', () => {
        debugLog(`[HueService] Request to ${url} timed out`)
        req.destroy()
        reject(new Error(`Request timed out after ${timeoutMs}ms`))
      })

      req.on('error', (err) => {
        debugLog(`[HueService] Request to ${url} error: ${err.message}`)
        reject(err)
      })
      if (body) req.write(body)
      req.end()
    })
  }
}

