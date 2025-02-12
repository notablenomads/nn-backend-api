import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKey } from './api-key.entity';
import { AuthGuard } from '../../core/guards/auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '1d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, AuthGuard],
  exports: [ApiKeyService, AuthGuard],
})
export class ApiKeyModule {}
