import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { LeadValidationService } from '../services/lead-validation.service';
import { LeadDto } from '../dto/lead.dto';
import {
  ProjectType,
  ServiceType,
  TargetAudience,
  Industry,
  DesignStyle,
  Timeline,
  Budget,
  ContactMethod,
  ExistingProjectChallenge,
  TechnicalExpertise,
} from '../enums/lead.enum';

describe('LeadValidationService', () => {
  let service: LeadValidationService;

  const mockValidLead: LeadDto = {
    projectType: ProjectType.EXISTING,
    existingProjectChallenges: [ExistingProjectChallenge.PERFORMANCE],
    projectDescription: 'Test project',
    services: [ServiceType.WEB_APP],
    hasCompetitors: false,
    competitorUrls: [],
    name: 'John Doe',
    email: 'john@example.com',
    preferredContactMethod: ContactMethod.EMAIL,
    wantsConsultation: true,
    targetAudience: TargetAudience.BUSINESSES,
    industry: Industry.SAAS,
    hasExistingBrand: false,
    designStyle: DesignStyle.MODERN,
    timeline: Timeline.LESS_THAN_3_MONTHS,
    budget: Budget.LESS_THAN_10K,
    technicalExpertise: TechnicalExpertise.NON_TECHNICAL,
    nonTechnicalDescription: 'I want to build a marketplace app',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadValidationService],
    }).compile();

    service = module.get<LeadValidationService>(LeadValidationService);
  });

  describe('validateLeadData', () => {
    it('should validate a valid lead without throwing errors', () => {
      expect(() => service.validateLeadData(mockValidLead)).not.toThrow();
    });

    describe('existing project validation', () => {
      it('should throw error when project type is EXISTING but challenge is missing', () => {
        const leadWithoutChallenge = {
          ...mockValidLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: undefined,
        };

        expect(() => service.validateLeadData(leadWithoutChallenge)).toThrow(HttpException);
      });

      it('should validate when project type is EXISTING and challenge is provided', () => {
        const validExistingProject = {
          ...mockValidLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: [ExistingProjectChallenge.PERFORMANCE],
        };

        expect(() => service.validateLeadData(validExistingProject)).not.toThrow();
      });
    });

    describe('competitor validation', () => {
      it('should throw error when hasCompetitors is true but URLs are missing', () => {
        const leadWithoutCompetitorUrls = {
          ...mockValidLead,
          hasCompetitors: true,
        };

        expect(() => service.validateLeadData(leadWithoutCompetitorUrls)).toThrow(HttpException);
      });

      it('should throw error when hasCompetitors is true but competitor URLs array is empty', () => {
        const leadWithEmptyCompetitorUrls = {
          ...mockValidLead,
          hasCompetitors: true,
          competitorUrls: [],
        };

        expect(() => service.validateLeadData(leadWithEmptyCompetitorUrls)).toThrow(HttpException);
      });

      it('should validate when hasCompetitors is true and URLs are provided', () => {
        const validLeadWithCompetitors = {
          ...mockValidLead,
          hasCompetitors: true,
          competitorUrls: ['https://competitor1.com', 'https://competitor2.com'],
        };

        expect(() => service.validateLeadData(validLeadWithCompetitors)).not.toThrow();
      });

      it('should validate when hasCompetitors is false regardless of competitorUrls', () => {
        const leadWithoutCompetitors = {
          ...mockValidLead,
          hasCompetitors: false,
          competitorUrls: undefined,
        };

        expect(() => service.validateLeadData(leadWithoutCompetitors)).not.toThrow();
      });
    });

    describe('existing project challenges validation', () => {
      it('should validate existing project challenges', () => {
        const invalidLead: LeadDto = {
          ...mockValidLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: undefined,
        };

        expect(() => service.validateLeadData(invalidLead)).toThrow(HttpException);
      });

      it('should validate when project type is NEW', () => {
        const validLead: LeadDto = {
          ...mockValidLead,
          projectType: ProjectType.NEW,
          existingProjectChallenges: undefined,
        };

        expect(() => service.validateLeadData(validLead)).not.toThrow();
      });

      it('should validate maximum number of challenges', () => {
        const invalidLead: LeadDto = {
          ...mockValidLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: [
            ExistingProjectChallenge.PERFORMANCE,
            ExistingProjectChallenge.SCALABILITY,
            ExistingProjectChallenge.BUGS,
            ExistingProjectChallenge.UX,
            ExistingProjectChallenge.OTHER,
            ExistingProjectChallenge.OTHER, // One extra to trigger error
          ],
        };

        expect(() => service.validateLeadData(invalidLead)).toThrow(HttpException);
      });

      it('should validate invalid challenge values', () => {
        const invalidLead: LeadDto = {
          ...mockValidLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: ['INVALID_CHALLENGE' as ExistingProjectChallenge],
        };

        expect(() => service.validateLeadData(invalidLead)).toThrow(HttpException);
      });

      it('should accept valid multiple challenges', () => {
        const validLead: LeadDto = {
          ...mockValidLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: [
            ExistingProjectChallenge.PERFORMANCE,
            ExistingProjectChallenge.SCALABILITY,
            ExistingProjectChallenge.UX,
          ],
        };

        expect(() => service.validateLeadData(validLead)).not.toThrow();
      });
    });

    describe('edge cases', () => {
      it('should handle undefined optional fields', () => {
        const leadWithUndefinedOptionals = {
          ...mockValidLead,
          company: undefined,
          additionalNotes: undefined,
        };

        expect(() => service.validateLeadData(leadWithUndefinedOptionals)).not.toThrow();
      });

      it('should validate a lead with all optional fields filled', () => {
        const leadWithAllFields = {
          ...mockValidLead,
          company: 'Test Company',
          additionalNotes: 'Some additional notes',
          existingProjectChallenge: ExistingProjectChallenge.PERFORMANCE,
          competitorUrls: ['https://competitor.com'],
        };

        expect(() => service.validateLeadData(leadWithAllFields)).not.toThrow();
      });
    });
  });
});
