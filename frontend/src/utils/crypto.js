/**
 * Utility for client-side RSA-OAEP payload encryption using the native Web Crypto API.
 * Ensures passwords and sensitive credentials are encrypted before entering the network layer,
 * so they are never visible as plaintext in DevTools or proxy logs.
 */

export async function encryptWithPublicKey(plaintext, publicKeyPem) {
  if (!window?.crypto?.subtle) {
    return null
  }

  try {
    // Strip PEM headers/footers and whitespace
    const cleanPem = publicKeyPem
      .replace(/-----BEGIN [A-Z ]+-----/g, '')
      .replace(/-----END [A-Z ]+-----/g, '')
      .replace(/\s+/g, '')

    // Decode base64 to binary ArrayBuffer
    const binaryString = window.atob(cleanPem)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Import public key into Web Crypto
    const cryptoKey = await window.crypto.subtle.importKey(
      'spki',
      bytes.buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    )

    // Encrypt the plaintext using RSA-OAEP SHA-256
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(plaintext)
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      cryptoKey,
      encodedData
    )

    // Convert encrypted ArrayBuffer to Base64
    const encryptedBytes = new Uint8Array(encryptedBuffer)
    let binary = ''
    for (let i = 0; i < encryptedBytes.byteLength; i++) {
      binary += String.fromCharCode(encryptedBytes[i])
    }

    return window.btoa(binary)
  } catch (err) {
    console.warn('[Crypto] Encryption failed, falling back:', err.message)
    return null
  }
}
