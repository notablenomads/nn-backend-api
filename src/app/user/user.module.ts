import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), LoggingModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
