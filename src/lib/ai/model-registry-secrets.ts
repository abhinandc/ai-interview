import crypto from "crypto"

const PREFIX = "v1"

function getEncryptionKey() {
  const secret = process.env.MODEL_REGISTRY_ENCRYPTION_SECRET
  if (!secret) {
    throw new Error("MODEL_REGISTRY_ENCRYPTION_SECRET is not configured")
  }

  // 32-byte key derived from the secret string.
  return crypto.createHash("sha256").update(secret, "utf8").digest()
}

export function encryptModelApiKey(plaintext: string) {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return [
    PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64")
  ].join(":")
}

export function decryptModelApiKey(payload: string) {
  const parts = String(payload || "").split(":")
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error("Unsupported encrypted payload format")
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(parts[1], "base64")
  const tag = Buffer.from(parts[2], "base64")
  const ciphertext = Buffer.from(parts[3], "base64")

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString("utf8")
}

