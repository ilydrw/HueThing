export const DISCOVERY_TIMEOUT_MS = 12000;

export const isValidBridgeIp = (value: string) => {
  const parts = value.trim().split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const numeric = Number(part);
    return numeric >= 0 && numeric <= 255;
  });
};
