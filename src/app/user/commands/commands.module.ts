import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { CreateSuperAdminCommand } from './create-super-admin.command';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [CreateSuperAdminCommand],
})
export class CommandsModule {}
