import { env } from "~/env.mjs";

export const CHECKIN_QR_TOKEN = env.NEXT_PUBLIC_CHECKIN_QR_TOKEN;
export const CHECKIN_QR_CONTENT = `tiani-checkin:${CHECKIN_QR_TOKEN}`;

export function isValidQrToken(value: string): boolean {
  return value === CHECKIN_QR_TOKEN;
}

export function parseQrContent(scannedText: string): string | null {
  const prefix = "tiani-checkin:";
  if (scannedText.startsWith(prefix)) {
    return scannedText.slice(prefix.length);
  }
  return null;
}
