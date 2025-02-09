import { timingSafeEqual, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoService {
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
}
