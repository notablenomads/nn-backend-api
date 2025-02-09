import { Request, Response, NextFunction } from 'express';
import { json } from 'express';
import { Injectable, NestMiddleware, PayloadTooLargeException } from '@nestjs/common';

@Injectable()
export class RequestSizeMiddleware implements NestMiddleware {
  private readonly MAX_REQUEST_SIZE = '10mb'; // Adjust as needed

  use(req: Request, res: Response, next: NextFunction) {
    json({
      limit: this.MAX_REQUEST_SIZE,
      verify: (req: Request, res: Response, buf: Buffer) => {
        if (buf.length > this.getBytes(this.MAX_REQUEST_SIZE)) {
          throw new PayloadTooLargeException(
            `Request body too large. Maximum size allowed is ${this.MAX_REQUEST_SIZE}`,
          );
        }
      },
    })(req, res, (err: any) => {
      if (err) {
        next(new PayloadTooLargeException(err.message));
      }
      next();
    });
  }

  private getBytes(size: string): number {
    const units = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+)([kmg]?b)$/);
    if (!match) return parseInt(size, 10);

    const [, value, unit] = match;
    return parseInt(value, 10) * (units[unit] || 1);
  }
}
