import crypto from "node:crypto";

import { env } from "../../config/env";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = Buffer.from(
    env.GITHUB_TOKEN_ENCRYPTION_KEY,
    "hex",
  );

  if (key.length !== 32) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as hexadecimal.",
    );
  }

  return key;
}

export function encryptGitHubToken(
  plaintext: string,
): string {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptGitHubToken(
  encryptedValue: string,
): string {
  const [ivHex, authTagHex, encryptedHex] =
    encryptedValue.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error(
      "Invalid encrypted GitHub token.",
    );
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(
    Buffer.from(authTagHex, "hex"),
  );

  const decrypted = Buffer.concat([
    decipher.update(
      Buffer.from(encryptedHex, "hex"),
    ),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}