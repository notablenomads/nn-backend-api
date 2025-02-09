import { timingSafeEqual, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CryptoService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('encryption.key');
    if (!key || key.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
    if (this.encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must decode to 32 bytes');
    }
  }

  async secureCompare(a: string, b: string): Promise<boolean> {
    if (!a || !b) {
      return false;
    }

    try {
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);

      return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  encryptToken(token: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encryptedData = cipher.update(token, 'utf8', 'hex');
    encryptedData += cipher.final('hex');

    return {
      encryptedData,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex'),
    };
  }

  decryptToken(encryptedData: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, Buffer.from(iv, 'hex'));

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
