import crypto from 'node:crypto';
import type { PasswordHasherPort } from '../application/ports.js';

export class CryptoPasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const parts = hash.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') {
      return false;
    }
    const salt = parts[1]!;
    const originalHash = parts[2]!;

    return new Promise((resolve) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return resolve(false);
        const originalBuffer = Buffer.from(originalHash, 'hex');
        if (originalBuffer.length !== derivedKey.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(originalBuffer, derivedKey));
      });
    });
  }
}
