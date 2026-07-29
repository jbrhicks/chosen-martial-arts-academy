import { secrets } from "base44:runtime";

// Short-lived HMAC-signed identity token proving a member was verified
// via kioskLookup (PIN / QR / phone / staff select) within the last 60 seconds.
// kioskCheckIn requires this token for all non-admin check-ins so the endpoint
// can't be called directly with a harvested user_id.

const TOKEN_TTL_MS = 60 * 1000;

function getSecret(): string {
  const secret = secrets.get("KIOSK_TOKEN_SECRET");
  if (!secret) throw new Error("KIOSK_TOKEN_SECRET not configured");
  return secret;
}

async function hmacSign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function issueCheckInToken(userId: string): Promise<string> {
  const payload = {
    sub: userId,
    exp: Date.now() + TOKEN_TTL_MS,
    jti: crypto.randomUUID(),
  };
  const payloadB64 = btoa(JSON.stringify(payload));
  const sig = await hmacSign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifyCheckInToken(token: string, userId: string): Promise<boolean> {
  try {
    if (!token || typeof token !== "string") return false;
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payloadB64, sig] = parts;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBytes = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(payloadB64));
    if (!valid) return false;

    const payload: { sub?: string; exp?: number } = JSON.parse(atob(payloadB64));
    if (payload.sub !== userId) return false;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}