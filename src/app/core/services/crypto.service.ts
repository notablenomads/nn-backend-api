import { timingSafeEqual, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CryptoService {
  private readonly SALT_ROUNDS = 10;
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('encryption.key');
    if (!key) {
      throw new Error('Encryption key not found in configuration');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async comparePasswords(plainText: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashedPassword);
  }

  generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  generateRandomBytes(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
      randomBytes(length, (err, buffer) => {
        if (err) reject(err);
        resolve(buffer.toString('hex'));
      });
    });
  }

  encryptToken(token: string): { encryptedData: string; iv: string; authTag: string } {
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  decryptToken(encryptedData: string, iv: string, authTag: string): string {
    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  compareTokens(token1: string, token2: string): boolean {
    try {
      return timingSafeEqual(Buffer.from(token1), Buffer.from(token2));
    } catch {
      return false;
    }
  }
}
