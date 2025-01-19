import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConnectionSecurityController } from './connection-security.controller';
import { ConnectionSecurityService } from './connection-security.service';

@Module({
  imports: [HttpModule],
  controllers: [ConnectionSecurityController],
  providers: [ConnectionSecurityService],
})
export class ConnectionSecurityModule {}
