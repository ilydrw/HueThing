import https from 'https'
import http from 'http'
import dgram from 'dgram'
import mDNS_raw from 'multicast-dns'
const mDNS = (mDNS_raw as any).default || mDNS_raw
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

// Self-signed cert agent for Hue Bridge HTTPS
const agent = new https.Agent({ rejectUnauthorized: false })

export class HueService {
  private config: HueBridgeConfig | null = null
  private lights: SimplifiedLight[] = []
  private rooms: SimplifiedRoom[] = []
  private scenes: SimplifiedScene[] = []
  private groupedLights: Map<string, HueGroupedLight> = new Map()
  private eventSource: ReturnType<typeof https.request> | null = null
  private onStateUpdate: ((state: HueState) => void) | null = null

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

  // ─── Bridge Discovery ────────────────────────────────────────────

  async discoverBridge(): Promise<string[]> {
    console.log('[HueService] Starting discovery...')
    const bridges = new Set<string>()

    // Priority 1: N-UPnP Cloud Discovery (Fastest, needs internet)
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

    // Parallel local discovery: mDNS + SSDP
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
    
    // Verify each candidate by checking description.xml
    await Promise.all(candidates.map(async (ip) => {
        try {
            const isHue = await this.verifyBridge(ip)
            if (isHue) {
                console.log(`[HueService] VERIFIED: ${ip} is a Hue Bridge`)
                verifiedBridges.push(ip)
            } else {
                console.log(`[HueService] REJECTED: ${ip} is not a verified Hue Bridge`)
            }
        } catch (err) {
            console.log(`[HueService] Verification failed for ${ip}:`, err)
        }
    }))

    console.log(`[HueService] Discovery finished. Verified bridges:`, verifiedBridges)
    return verifiedBridges
  }

  private async verifyBridge(ip: string): Promise<boolean> {
    return new Promise((resolve) => {
      const url = `http://${ip}/description.xml`
      const options = { timeout: 2000 }
      
      http.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          resolve(false)
          return
        }
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          const isHue = data.toLowerCase().includes('philips hue bridge') || 
                        data.toLowerCase().includes('philips-hue')
          resolve(isHue)
        })
      }).on('error', () => resolve(false))
      .on('timeout', () => resolve(false))
    })
  }

  private discoverViaMDNS(): Promise<string[]> {
    return new Promise((resolve) => {
      const mdns = mDNS()
      const bridges = new Set<string>()
      
      console.log('[HueService] Searching mDNS...')

      mdns.on('response', (response: any) => {
        const records = [...(response.answers || []), ...(response.additionals || [])]
        
        records.forEach((record: any) => {
          if (record.type === 'A') {
            // Broaden search: any A record in a response that might be hue-related
            // Discovery verification will filter out non-hue devices
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
        'ST: ssdp:all\r\n' + // Search for everything, verification will filter
        '\r\n'
      )

      client.on('message', (msg, rinfo) => {
        const response = msg.toString()
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

  async pairBridge(bridgeIp: string): Promise<{ success: boolean; appKey?: string; error?: string }> {
    try {
      const body = JSON.stringify({
        devicetype: 'deskthing_hue#carthing',
        generateclientkey: true
      })

      const response = await this.httpPost(`https://${bridgeIp}/api`, body)
      const result = JSON.parse(response)

      if (Array.isArray(result) && result[0]) {
        if (result[0].success) {
          const appKey = result[0].success.username
          const clientKey = result[0].success.clientkey
          this.config = { bridgeIp, appKey, clientKey }
          return { success: true, appKey }
        }
        if (result[0].error) {
          return { success: false, error: result[0].error.description }
        }
      }
      return { success: false, error: 'Unexpected response from bridge' }
    } catch (err) {
      return { success: false, error: `Connection failed: ${err}` }
    }
  }

  // ─── EventStream (Real-time updates) ──────────────────────────────

  async startEventStream() {
    if (!this.config || this.eventSource) return

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
        timeout: 0 // Keep open indefinitely
      }

      this.eventSource = https.request(url, options, (res) => {
        console.log(`[HueService] EventStream connected: ${res.statusCode}`)
        
        let buffer = ''
        res.on('data', (chunk) => {
          buffer += chunk.toString()
          
          // Events are separated by double newlines or single newlines depending on implementation
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            this.handleEvent(part)
          }
        })

        res.on('error', (err) => {
          console.error('[HueService] EventStream response error:', err)
          this.reconnectEventStream()
        })

        res.on('close', () => {
          console.log('[HueService] EventStream closed.')
          this.reconnectEventStream()
        })
      })

      this.eventSource.on('error', (err) => {
        console.error('[HueService] EventStream request error:', err)
        this.reconnectEventStream()
      })

      this.eventSource.end()
    } catch (err) {
      console.error('[HueService] Failed to start EventStream:', err)
      this.reconnectEventStream()
    }
  }

  stopEventStream() {
    if (this.eventSource) {
      this.eventSource.destroy()
      this.eventSource = null
    }
  }

  private reconnectEventStream() {
    this.stopEventStream()
    setTimeout(() => this.startEventStream(), 5000)
  }

  private async handleEvent(eventData: string) {
    try {
      // Event stream format is:
      // id: <id>
      // data: [<event_objects>]
      
      const lines = eventData.split('\n')
      const dataLine = lines.find(l => l.startsWith('data: '))
      if (!dataLine) return

      const jsonStr = dataLine.substring(6)
      const events = JSON.parse(jsonStr)

      if (!Array.isArray(events)) return

      let needsRefresh = false
      for (const event of events) {
        // Only trigger a full state refresh if an actual update/add/delete happened
        if (event.type === 'update' || event.type === 'add' || event.type === 'delete') {
          needsRefresh = true
          break
        }
      }

      if (needsRefresh && this.onStateUpdate) {
        console.log('[HueService] State change detected via EventStream. Refreshing...')
        const newState = await this.fetchAllData()
        this.onStateUpdate(newState)
      }
    } catch (err) {
      // Squelch JSON parse errors from malformed chunks
    }
  }

  // ─── Fetch Data ──────────────────────────────────────────────────

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
      const [lightsRaw, roomsRaw, groupedRaw, scenesRaw] = await Promise.all([
        this.apiGet<HueLight>('/clip/v2/resource/light'),
        this.apiGet<HueRoom>('/clip/v2/resource/room'),
        this.apiGet<HueGroupedLight>('/clip/v2/resource/grouped_light'),
        this.apiGet<HueScene>('/clip/v2/resource/scene')
      ])

      // Map grouped lights
      this.groupedLights.clear()
      for (const gl of groupedRaw) {
        this.groupedLights.set(gl.id, gl)
      }

      // Build room-to-light and room-to-scene mappings
      const deviceToRoom = new Map<string, string>()
      for (const room of roomsRaw) {
        for (const child of room.children) {
          deviceToRoom.set(child.rid, room.id)
        }
      }

      // Simplify lights
      this.lights = lightsRaw.map((light): SimplifiedLight => {
        // Find the room this light belongs to via its owner (device)
        const roomId = deviceToRoom.get(light.owner.rid)
        return {
          id: light.id,
          name: light.metadata.name,
          on: light.on.on,
          brightness: light.dimming?.brightness ?? 100,
          colorXY: light.color?.xy,
          colorTemp: light.color_temperature?.mirek ?? undefined,
          colorTempRange: light.color_temperature?.mirek_schema
            ? { min: light.color_temperature.mirek_schema.mirek_minimum, max: light.color_temperature.mirek_schema.mirek_maximum }
            : undefined,
          hasColor: !!light.color,
          hasColorTemp: !!light.color_temperature?.mirek_valid,
          roomId
        }
      })

      // Simplify rooms
      this.rooms = roomsRaw.map((room): SimplifiedRoom => {
        const groupedLightService = room.services.find(s => s.rtype === 'grouped_light')
        const gl = groupedLightService ? this.groupedLights.get(groupedLightService.rid) : undefined

        const roomLights = this.lights.filter(l => l.roomId === room.id)
        const roomScenes = scenesRaw
          .filter(s => s.group.rid === room.id)
          .map(s => s.id)

        return {
          id: room.id,
          name: room.metadata.name,
          groupedLightId: groupedLightService?.rid,
          on: gl?.on?.on ?? roomLights.some(l => l.on),
          brightness: gl?.dimming?.brightness ?? 100,
          lightIds: roomLights.map(l => l.id),
          sceneIds: roomScenes
        }
      })

      // Simplify scenes
      this.scenes = scenesRaw.map((scene): SimplifiedScene => ({
        id: scene.id,
        name: scene.metadata.name,
        roomId: scene.group.rid,
        colors: scene.palette?.color?.map(c => ({
          x: c.color.xy.x,
          y: c.color.xy.y,
          brightness: c.dimming.brightness
        })) ?? []
      }))

      return {
        connected: true,
        paired: true,
        bridgeIp: this.config!.bridgeIp,
        lights: this.lights,
        rooms: this.rooms,
        scenes: this.scenes
      }
    } catch (err) {
      console.error('Failed to fetch Hue data:', err)
      return {
        connected: false,
        paired: true,
        bridgeIp: this.config?.bridgeIp || '',
        lights: this.lights,
        rooms: this.rooms,
        scenes: this.scenes
      }
    }
  }

  // ─── Light Control ───────────────────────────────────────────────

  async setLightState(lightId: string, state: {
    on?: boolean
    brightness?: number
    colorXY?: { x: number; y: number }
    colorTemp?: number
  }): Promise<boolean> {
    const body: Record<string, any> = {}
    if (state.on !== undefined) body.on = { on: state.on }
    if (state.brightness !== undefined) body.dimming = { brightness: state.brightness }
    if (state.colorXY) body.color = { xy: state.colorXY }
    if (state.colorTemp !== undefined) body.color_temperature = { mirek: state.colorTemp }

    return this.apiPut(`/clip/v2/resource/light/${lightId}`, body)
  }

  async setGroupedLightState(groupedLightId: string, state: {
    on?: boolean
    brightness?: number
  }): Promise<boolean> {
    const body: Record<string, any> = {}
    if (state.on !== undefined) body.on = { on: state.on }
    if (state.brightness !== undefined) body.dimming = { brightness: state.brightness }

    return this.apiPut(`/clip/v2/resource/grouped_light/${groupedLightId}`, body)
  }

  async activateScene(sceneId: string): Promise<boolean> {
    return this.apiPut(`/clip/v2/resource/scene/${sceneId}`, {
      recall: { action: 'active' }
    })
  }

  async toggleAllLights(on: boolean): Promise<boolean> {
    const promises = Array.from(this.groupedLights.values()).map(gl =>
      this.setGroupedLightState(gl.id, { on })
    )
    const results = await Promise.all(promises)
    return results.every(r => r)
  }

  // ─── Getters ─────────────────────────────────────────────────────

  getLights() { return this.lights }
  getRooms() { return this.rooms }
  getScenes() { return this.scenes }

  // ─── HTTP Helpers ────────────────────────────────────────────────

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
      'hue-application-key': this.config!.appKey
    })
  }

  private httpGet(url: string): Promise<string> {
    return this.httpRequest(url, 'GET')
  }

  private httpPost(url: string, body: string): Promise<string> {
    return this.httpRequest(url, 'POST', body, { 'Content-Type': 'application/json' })
  }

  private httpRequest(
    url: string,
    method: string,
    body?: string,
    headers?: Record<string, string>
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url)
      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        agent,
        headers: {
          ...headers,
          ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {})
        }
      }

      // Use http for discovery.meethue.com, https for bridge
      const protocol = parsedUrl.protocol === 'http:' ? http : https

      const req = protocol.request(options, (res: any) => {
        let data = ''
        res.on('data', (chunk: string) => { data += chunk })
        res.on('end', () => resolve(data))
      })

      req.on('error', reject)
      if (body) req.write(body)
      req.end()
    })
  }
}
