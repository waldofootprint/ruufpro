import { randomInt } from "crypto";
import QRCode from "qrcode";

const ALPHABET = "023456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LEN = 6;
const FORMAT_RE = /^[023456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;

export function generateQrShortCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

export function isValidQrShortCode(code: string): boolean {
  return FORMAT_RE.test(code);
}

export function normalizeQrShortCode(input: string): string | null {
  const upper = input.toUpperCase().replace(/[OIL]/g, (c) =>
    c === "O" ? "0" : "1"
  );
  return FORMAT_RE.test(upper) ? upper : null;
}

// Render a QR code as a base64 PNG data URL. Used on postcard back so Lob's
// HTML→PDF renderer never has to fetch a third-party image at print time —
// removes the failure mode where a network blip ships a card with a blank QR.
//
// 560px target = 280px display @ 2× density for crisp print at 300 DPI on a
// 6×11 postcard. Error-correction level H (~30% recoverable) survives smudges
// and partial covers — direct mail rarely arrives pristine.
export async function generateQrPngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    type: "image/png",
    width: 560,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
