"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptToken = encryptToken;
exports.decryptToken = decryptToken;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM
const DEFAULT_DEV_KEY = 'devrep-super-secure-32byte-jwt-secret-key-32b'; // Fallback for local development
function getEncryptionKey() {
    const secret = process.env.ENCRYPTION_SECRET || DEFAULT_DEV_KEY;
    // Ensure key is exactly 32 bytes (256 bits) using SHA-256
    return crypto_1.default.createHash('sha256').update(secret).digest();
}
/**
 * Encrypts a plaintext string (such as GitHub OAuth Access Token) using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (hex-encoded)
 */
function encryptToken(plaintext) {
    if (!plaintext)
        return '';
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}
/**
 * Decrypts an AES-256-GCM formatted token string.
 * Returns decrypted plaintext token or throws on tampering.
 */
function decryptToken(encryptedString) {
    if (!encryptedString)
        return '';
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
    }
    const [ivHex, authTagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
