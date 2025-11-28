import CryptoJS from 'crypto-js'

export function generateEncryptionKey(signature: string): string {
  return CryptoJS.SHA256(signature).toString()
}

export function encryptData(data: any, key: string): string {
  const jsonString = JSON.stringify(data)
  return CryptoJS.AES.encrypt(jsonString, key).toString()
}

export function decryptData(encryptedData: string, key: string): any {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(decryptedString)
  } catch (error) {
    console.error('Decryption failed:', error)
    return null
  }
}
