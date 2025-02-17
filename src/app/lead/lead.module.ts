import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { ApiKeyModule } from '../auth/api-key/api-key.module';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { LeadValidationService } from './services/lead-validation.service';
import { Lead } from './entities/lead.entity';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), EmailModule, ApiKeyModule, AwsModule],
  providers: [LeadService, LeadValidationService],
  controllers: [LeadController],
  exports: [LeadService],
})
export class LeadModule {}
