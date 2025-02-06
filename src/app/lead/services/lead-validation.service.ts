import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LeadDto } from '../dto/lead.dto';
import { ProjectType } from '../enums/lead.enum';
import { LEAD_ERRORS, createLeadValidationError } from '../constants/lead.errors';

@Injectable()
export class LeadValidationService {
  validateLeadData(leadData: LeadDto): void | never {
    this.validateExistingProjectFields(leadData);
    this.validateCompetitorUrls(leadData);
  }

  private validateExistingProjectFields(leadData: LeadDto): void | never {
    if (leadData.projectType === ProjectType.EXISTING && !leadData.existingProjectChallenge) {
      throw new HttpException(
        createLeadValidationError({
          existingProjectChallenge: [LEAD_ERRORS.VALIDATION.EXISTING_PROJECT_CHALLENGE.message],
        }),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateCompetitorUrls(leadData: LeadDto): void | never {
    if (leadData.hasCompetitors && (!leadData.competitorUrls || leadData.competitorUrls.length === 0)) {
      throw new HttpException(
        createLeadValidationError({
          competitorUrls: [LEAD_ERRORS.VALIDATION.COMPETITOR_URLS.message],
        }),
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
