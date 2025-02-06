import { Injectable } from '@nestjs/common';
import { LeadDto } from '../dto/lead.dto';
import { ProjectType } from '../enums/lead.enum';

@Injectable()
export class LeadValidationService {
  validateLeadData(leadData: LeadDto): void | never {
    this.validateExistingProjectFields(leadData);
    this.validateCompetitorUrls(leadData);
  }

  private validateExistingProjectFields(leadData: LeadDto): void | never {
    if (leadData.projectType === ProjectType.EXISTING && !leadData.existingProjectChallenge) {
      throw {
        response: {
          message: 'Validation failed',
          errors: {
            existingProjectChallenge: ['Challenge must be specified for existing projects'],
          },
        },
      };
    }
  }

  private validateCompetitorUrls(leadData: LeadDto): void | never {
    if (leadData.hasCompetitors && (!leadData.competitorUrls || leadData.competitorUrls.length === 0)) {
      throw {
        response: {
          message: 'Validation failed',
          errors: {
            competitorUrls: ['Competitor URLs must be provided when hasCompetitors is true'],
          },
        },
      };
    }
  }
}
