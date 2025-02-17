import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LeadDto } from '../dto/lead.dto';
import { ProjectType, ExistingProjectChallenge } from '../enums/lead.enum';
import { LEAD_ERRORS, createLeadValidationError } from '../constants/lead.errors';

@Injectable()
export class LeadValidationService {
  validateLeadData(leadData: LeadDto): void | never {
    this.validateExistingProjectFields(leadData);
    this.validateCompetitorUrls(leadData);
  }

  private validateExistingProjectFields(leadData: LeadDto): void | never {
    // Validate project type and challenges
    if (leadData.projectType === ProjectType.EXISTING) {
      if (!leadData.existingProjectChallenges || leadData.existingProjectChallenges.length === 0) {
        throw new HttpException(
          {
            message: LEAD_ERRORS.VALIDATION.INVALID_INPUT.message,
            errors: {
              existingProjectChallenges: [LEAD_ERRORS.VALIDATION.PROJECT_CHALLENGES.message],
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (leadData.existingProjectChallenges.length > 5) {
        throw new HttpException(
          {
            message: LEAD_ERRORS.VALIDATION.INVALID_INPUT.message,
            errors: {
              existingProjectChallenges: ['Maximum of 5 challenges can be selected'],
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const invalidChallenges = leadData.existingProjectChallenges.some(
        (challenge) => !Object.values(ExistingProjectChallenge).includes(challenge),
      );

      if (invalidChallenges) {
        throw new HttpException(
          {
            message: LEAD_ERRORS.VALIDATION.INVALID_INPUT.message,
            errors: {
              existingProjectChallenges: ['One or more invalid project challenges selected'],
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }
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
