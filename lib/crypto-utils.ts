/**
 * Crypto utilities for encrypting sensitive data
 * Uses AES-GCM encryption with Web Crypto API
 */

// Encryption key derived from environment variable
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'bloomshield-default-key-change-in-production';

// Convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to string
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

// Convert Uint8Array to base64
function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(arr)));
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Derive a cryptographic key from the encryption key string
async function deriveKey(): Promise<CryptoKey> {
  const keyBytes = stringToUint8Array(ENCRYPTION_KEY);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    keyBytes as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const saltBytes = stringToUint8Array('bloomshield-salt-v1');
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as BufferSource, // Static salt for deterministic key
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string using AES-GCM
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data with IV prepended
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await deriveKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encodedText = stringToUint8Array(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      encodedText as BufferSource
    );

    // Prepend IV to ciphertext for storage
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return uint8ArrayToBase64(combined);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string using AES-GCM
 * @param encryptedData - Base64-encoded encrypted data with IV prepended
 * @returns Decrypted plaintext string
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await deriveKey();
    const combined = base64ToUint8Array(encryptedData);

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      ciphertext as BufferSource
    );

    return uint8ArrayToString(new Uint8Array(decrypted));
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return null for backward compatibility with unencrypted data
    return encryptedData; // Fallback: return as-is if decryption fails
  }
}

/**
 * Check if a string is encrypted (base64 format check)
 * @param data - The string to check
 * @returns True if data appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
  // Encrypted data will be base64 and longer than typical seed phrases
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(data) && data.length > 100;
}
