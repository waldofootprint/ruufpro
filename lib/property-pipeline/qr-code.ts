import { randomInt } from "crypto";

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
