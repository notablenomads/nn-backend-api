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
} from '../enums/lead.enum';

describe('LeadValidationService', () => {
  let service: LeadValidationService;

  const mockValidLead: LeadDto = {
    services: [ServiceType.WEB_APP],
    projectType: ProjectType.NEW,
    projectDescription: 'Test project description',
    targetAudience: TargetAudience.BUSINESSES,
    industry: Industry.SAAS,
    hasCompetitors: false,
    hasExistingBrand: false,
    designStyle: DesignStyle.MODERN,
    timeline: Timeline.LESS_THAN_3_MONTHS,
    budget: Budget.LESS_THAN_10K,
    name: 'John Doe',
    email: 'john@example.com',
    preferredContactMethod: ContactMethod.EMAIL,
    wantsConsultation: true,
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
        };

        expect(() => service.validateLeadData(leadWithoutChallenge)).toThrow(HttpException);
      });

      it('should validate when project type is EXISTING and challenge is provided', () => {
        const validExistingProject = {
          ...mockValidLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenge: ExistingProjectChallenge.PERFORMANCE,
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
