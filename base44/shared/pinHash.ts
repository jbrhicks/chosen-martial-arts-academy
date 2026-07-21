const ITERATIONS = 100000;

async function derivePinHash(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const hash = await derivePinHash(pin, salt);
  return `pbkdf2:${salt}:${hash}`;
}

export async function verifyPin(pin: string, storedValue: string): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  if (!storedValue) return { valid: false, needsUpgrade: false };

  if (storedValue.startsWith('pbkdf2:')) {
    const parts = storedValue.split(':');
    const salt = parts[1];
    const expectedHash = parts[2];
    const inputHash = await derivePinHash(pin, salt);
    return { valid: inputHash === expectedHash, needsUpgrade: false };
  }

  // Backward compat: plaintext PIN — verify and flag for upgrade
  if (storedValue === pin) {
    return { valid: true, needsUpgrade: true };
  }

  return { valid: false, needsUpgrade: false };
}