import { SESClient } from '@aws-sdk/client-ses';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SESClient,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new SESClient({
          region: configService.get('AWS_REGION'),
          credentials: {
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
          },
        });
      },
    },
  ],
  exports: [SESClient],
})
export class AwsModule {}
