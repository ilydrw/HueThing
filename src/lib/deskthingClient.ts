import { DeskThingClass } from '@deskthing/client';
import type {
  HueClientMessageMap,
  HueClientMessageType,
  HueServerMessageMap,
  HueServerMessageType
} from '../../shared/messages';

const deskthing = DeskThingClass.getInstance();

function hasPayload(value: unknown): value is { payload: unknown } {
  return typeof value === 'object' && value !== null && 'payload' in value;
}

export function sendHueClientMessage<K extends HueClientMessageType>(
  type: K,
  ...payload: HueClientMessageMap[K] extends undefined ? [] : [HueClientMessageMap[K]]
) {
  if (payload.length === 0) {
    deskthing.send({ type });
    return;
  }

  deskthing.send({ type, payload: payload[0] });
}

export function subscribeHueServerMessage<K extends HueServerMessageType>(
  type: K,
  handler: (payload: HueServerMessageMap[K]) => void
) {
  return deskthing.on(type as any, (data: unknown) => {
    if (!hasPayload(data)) {
      return;
    }

    handler(data.payload as HueServerMessageMap[K]);
  });
}

export { deskthing };
