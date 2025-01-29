import { readFileSync } from 'fs';
import { join } from 'path';
import { Injectable, Logger } from '@nestjs/common';

export interface IPackageInfo {
  name: string;
  version: string;
  description: string;
}

@Injectable()
export class PackageInfoService {
  private readonly logger = new Logger(PackageInfoService.name);
  private packageInfo: IPackageInfo;

  constructor() {
    this.loadPackageInfo();
  }

  private loadPackageInfo(): void {
    try {
      const packageJsonPath = join(process.cwd(), 'package.json');
      const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      this.packageInfo = {
        name: packageJson.name || 'Notable Nomads API',
        version: packageJson.version || '1.0.0',
        description: packageJson.description || 'Notable Nomads Backend API',
      };
    } catch (error) {
      this.logger.warn('Failed to load package.json:', error);
      // Fallback values
      this.packageInfo = {
        name: 'Notable Nomads API',
        version: '1.0.0',
        description: 'Notable Nomads Backend API',
      };
    }
  }

  getPackageInfo(): IPackageInfo {
    return this.packageInfo;
  }
}
