import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private readonly blockedPaths: RegExp[] = [
    /\.env(\..+)?$/, // Block all .env files
    /\.git\/.*/, // Block .git directory
    /\.gitignore$/, // Block .gitignore
    /\.npmrc$/, // Block .npmrc
    /\.yarnrc\.yml$/, // Block .yarnrc.yml
    /package\.json$/, // Block package.json
    /yarn\.lock$/, // Block yarn.lock
    /node_modules\/.*/, // Block node_modules
    /\.dockerignore$/, // Block .dockerignore
    /Dockerfile$/, // Block Dockerfile
    /docker-compose\.yml$/, // Block docker-compose.yml
    /\.github\/.*/, // Block .github directory
    /\.vscode\/.*/, // Block .vscode directory
    /\.idea\/.*/, // Block .idea directory
    /\.(log|pid|yml|yaml|xml|conf|config|ini|sh|bash|sql|sqlite|sqlite3|db)$/i, // Block common config/sensitive files
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path.toLowerCase();

    // Check if the requested path matches any blocked patterns
    if (this.blockedPaths.some((pattern) => pattern.test(path))) {
      this.logger.warn(`Blocked access attempt to sensitive path: ${path} from IP: ${req.ip}`);
      return res.status(404).json({
        statusCode: 404,
        message: 'Not Found',
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }

    next();
  }
}
