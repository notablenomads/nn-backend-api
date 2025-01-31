import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { Lead } from './entities/lead.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), EmailModule],
  providers: [LeadService],
  controllers: [LeadController],
  exports: [LeadService],
})
export class LeadModule {}
