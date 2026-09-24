import { DeskThing } from '@deskthing/server';
import type {
  HueClientMessageMap,
  HueClientMessageType,
  HueServerMessageMap,
  HueServerMessageType
} from '../shared/messages.js';

export function sendHueServerMessage<K extends HueServerMessageType>(
  type: K,
  payload: HueServerMessageMap[K]
) {
  DeskThing.send({ type, payload });
}

function hasPayload(value: unknown): value is { payload: unknown } {
  return typeof value === 'object' && value !== null && 'payload' in value;
}

export function registerHueClientHandler<K extends HueClientMessageType>(
  type: K,
  handler: (payload: HueClientMessageMap[K]) => void | Promise<void>
) {
  return DeskThing.on(type as any, (data: unknown) => {
    if (!hasPayload(data)) {
      return handler(undefined as HueClientMessageMap[K]);
    }

    return handler(data.payload as HueClientMessageMap[K]);
  });
}

export function getPayload<T>(data: { payload?: T } | undefined): T | undefined {
  return data?.payload;
}
