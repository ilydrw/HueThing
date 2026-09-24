import type { HueStoreState } from '../state/hueReducer';

export const isHuePreview = () => (
  import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'hue'
);

export function createHuePreviewState(): HueStoreState {
  return {
    hueState: {
      connected: true,
      paired: true,
      bridgeIp: '192.168.1.24',
      bridgeName: 'Hue Bridge',
      modelId: 'BSB002',
      lights: [
        { id: 'light-1', name: 'Floor lamp', on: true, brightness: 72, colorXY: { x: 0.52, y: 0.38 }, hasColor: true, hasColorTemp: true, roomId: 'living', roomName: 'Living room', archetype: 'floor_shade' },
        { id: 'light-2', name: 'TV gradient', on: true, brightness: 46, colorXY: { x: 0.19, y: 0.12 }, hasColor: true, hasColorTemp: true, roomId: 'living', roomName: 'Living room', archetype: 'hue_lightstrip' },
        { id: 'light-3', name: 'Sofa lamp', on: false, brightness: 30, colorXY: { x: 0.31, y: 0.33 }, hasColor: true, hasColorTemp: true, roomId: 'living', roomName: 'Living room', archetype: 'table_shade' },
        { id: 'light-4', name: 'Ceiling', on: true, brightness: 84, colorTemp: 285, hasColor: false, hasColorTemp: true, roomId: 'kitchen', roomName: 'Kitchen', archetype: 'ceiling_round' },
        { id: 'light-5', name: 'Island', on: true, brightness: 84, colorTemp: 250, hasColor: false, hasColorTemp: true, roomId: 'kitchen', roomName: 'Kitchen', archetype: 'pendant_round' },
        { id: 'light-6', name: 'Bedside', on: false, brightness: 22, colorXY: { x: 0.57, y: 0.37 }, hasColor: true, hasColorTemp: true, roomId: 'bedroom', roomName: 'Bedroom', archetype: 'table_shade' },
        { id: 'light-7', name: 'Desk lamp', on: true, brightness: 58, colorXY: { x: 0.22, y: 0.22 }, hasColor: true, hasColorTemp: true, roomId: 'office', roomName: 'Office', archetype: 'desk_lamp' }
      ],
      rooms: [
        { id: 'living', name: 'Living room', archetype: 'living_room', groupedLightId: 'group-1', on: true, brightness: 59, lightIds: ['light-1', 'light-2', 'light-3'], sceneIds: ['scene-1', 'scene-2', 'scene-3'] },
        { id: 'kitchen', name: 'Kitchen', archetype: 'kitchen', groupedLightId: 'group-2', on: true, brightness: 84, lightIds: ['light-4', 'light-5'], sceneIds: ['scene-4', 'scene-5'] },
        { id: 'office', name: 'Office', archetype: 'office', groupedLightId: 'group-4', on: true, brightness: 58, lightIds: ['light-7'], sceneIds: ['scene-6'] },
        { id: 'bedroom', name: 'Bedroom', archetype: 'bedroom', groupedLightId: 'group-3', on: false, brightness: 22, lightIds: ['light-6'], sceneIds: [] }
      ],
      scenes: [
        { id: 'scene-1', name: 'Tropical twilight', roomId: 'living', colors: [{ x: 0.58, y: 0.3, brightness: 62 }, { x: 0.25, y: 0.12, brightness: 48 }] },
        { id: 'scene-2', name: 'Savanna sunset', roomId: 'living', colors: [{ x: 0.62, y: 0.34, brightness: 72 }, { x: 0.48, y: 0.42, brightness: 58 }] },
        { id: 'scene-3', name: 'Arctic aurora', roomId: 'living', colors: [{ x: 0.18, y: 0.24, brightness: 64 }, { x: 0.24, y: 0.12, brightness: 52 }] },
        { id: 'scene-4', name: 'Energize', roomId: 'kitchen', colors: [{ x: 0.31, y: 0.33, brightness: 100 }] },
        { id: 'scene-5', name: 'Concentrate', roomId: 'kitchen', colors: [{ x: 0.3, y: 0.31, brightness: 90 }] },
        { id: 'scene-6', name: 'Ocean dawn', roomId: 'office', colors: [{ x: 0.2, y: 0.22, brightness: 70 }, { x: 0.42, y: 0.28, brightness: 55 }] }
      ]
    },
    syncAreas: [
      { id: 'sync-1', name: 'Living room TV', locations: [{ lightId: '/lights/1' }, { lightId: '/lights/2' }, { lightId: '/lights/3' }] },
      { id: 'sync-2', name: 'Office monitor', locations: [{ lightId: '/lights/7' }] }
    ],
    discoveredBridges: [],
    pairStatus: null,
    syncStatus: { active: false, areaId: null },
    syncError: null
  };
}
