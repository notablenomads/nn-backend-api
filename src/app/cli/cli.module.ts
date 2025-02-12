import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { CreateSuperAdminCommand } from './commands/create-super-admin.command';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [CreateSuperAdminCommand],
})
export class CliModule {}
