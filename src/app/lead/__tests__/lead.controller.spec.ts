import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LeadController } from '../lead.controller';
import { LeadService } from '../lead.service';
import { LeadValidationService } from '../services/lead-validation.service';
import { LeadDto } from '../dto/lead.dto';
import { LeadResponseDto } from '../interfaces/lead-response.dto';
import { ApiKeyService } from '../../auth/api-key/api-key.service';
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
  TechnicalFeature,
} from '../enums/lead.enum';
import { createLeadProcessingError } from '../constants/lead.errors';
import { ApiKeyGuard } from '../../auth/api-key/api-key.guard';

describe('LeadController', () => {
  let controller: LeadController;
  let leadService: LeadService;
  let leadValidationService: LeadValidationService;

  const mockLead: LeadDto = {
    services: [ServiceType.WEB_APP],
    projectType: ProjectType.NEW,
    projectDescription: 'Test project description',
    targetAudience: TargetAudience.BUSINESSES,
    industry: Industry.SAAS,
    hasCompetitors: false,
    competitorUrls: undefined,
    hasExistingBrand: false,
    designStyle: DesignStyle.MODERN,
    timeline: Timeline.LESS_THAN_3_MONTHS,
    budget: Budget.LESS_THAN_10K,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: undefined,
    preferredContactMethod: ContactMethod.EMAIL,
    wantsConsultation: true,
    additionalNotes: undefined,
    technicalExpertise: TechnicalExpertise.TECHNICAL,
    technicalFeatures: [TechnicalFeature.AUTHENTICATION, TechnicalFeature.PAYMENTS, TechnicalFeature.NOTIFICATIONS],
  };

  const mockLeadResponse = {
    id: 'test-id',
    ...mockLead,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApiKeyService = {
    validateApiKey: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadController],
      providers: [
        {
          provide: LeadService,
          useValue: {
            submitLead: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: LeadValidationService,
          useValue: {
            validateLeadData: jest.fn(),
          },
        },
        {
          provide: ApiKeyService,
          useValue: mockApiKeyService,
        },
        {
          provide: ApiKeyGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<LeadController>(LeadController);
    leadService = module.get<LeadService>(LeadService);
    leadValidationService = module.get<LeadValidationService>(LeadValidationService);
  });

  describe('submitLead', () => {
    beforeEach(() => {
      jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation();
      jest.spyOn(leadService, 'submitLead').mockResolvedValue(true);
    });

    it('should successfully submit a new project lead', async () => {
      const newProjectLead: LeadDto = {
        ...mockLead,
        projectType: ProjectType.NEW,
        services: [ServiceType.WEB_APP, ServiceType.MOBILE_APP],
        hasCompetitors: true,
        competitorUrls: ['competitor1.com', 'competitor2.com'],
        projectDescription: 'Building a new cross-platform application',
      };

      const result = await controller.submitLead(newProjectLead);

      expect(leadValidationService.validateLeadData).toHaveBeenCalledWith(newProjectLead);
      expect(leadService.submitLead).toHaveBeenCalledWith(newProjectLead);
      expect(result).toEqual({
        message: 'Lead submitted successfully',
        success: true,
      });
    });

    it('should successfully submit an existing project lead with challenges', async () => {
      const existingProjectLead: LeadDto = {
        ...mockLead,
        projectType: ProjectType.EXISTING,
        services: [ServiceType.ARCHITECTURE, ServiceType.DEVOPS],
        existingProjectChallenges: [ExistingProjectChallenge.PERFORMANCE],
        hasExistingBrand: true,
        projectDescription: 'Need to improve our existing web application',
      };

      const result = await controller.submitLead(existingProjectLead);

      expect(leadValidationService.validateLeadData).toHaveBeenCalledWith(existingProjectLead);
      expect(leadService.submitLead).toHaveBeenCalledWith(existingProjectLead);
      expect(result).toEqual({
        message: 'Lead submitted successfully',
        success: true,
      });
    });

    it('should successfully submit a lead with multiple services', async () => {
      const multiServiceLead: LeadDto = {
        ...mockLead,
        services: [ServiceType.WEB_APP, ServiceType.MOBILE_APP, ServiceType.AI_ML, ServiceType.DEVOPS],
        designStyle: DesignStyle.PROFESSIONAL,
        hasExistingBrand: false,
        timeline: Timeline.MORE_THAN_6_MONTHS,
        budget: Budget.MORE_THAN_100K,
      };

      const result = await controller.submitLead(multiServiceLead);

      expect(leadValidationService.validateLeadData).toHaveBeenCalledWith(multiServiceLead);
      expect(leadService.submitLead).toHaveBeenCalledWith(multiServiceLead);
      expect(result).toEqual({
        message: 'Lead submitted successfully',
        success: true,
      });
    });

    it('should handle validation errors from lead validation service', async () => {
      const invalidLead: LeadDto = {
        ...mockLead,
        projectType: ProjectType.EXISTING,
        // Missing required existingProjectChallenges for EXISTING project type
      };

      jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
        throw new HttpException(
          {
            message: 'Validation failed',
            errors: ['Please specify at least one challenge for your existing project'],
          },
          HttpStatus.BAD_REQUEST,
        );
      });

      await expect(controller.submitLead(invalidLead)).rejects.toThrow(HttpException);
    });

    it('should handle lead submission failure', async () => {
      jest.spyOn(leadService, 'submitLead').mockResolvedValue(false);

      await expect(controller.submitLead(mockLead)).rejects.toThrow(
        new HttpException(
          createLeadProcessingError('Failed to process lead submission'),
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle unexpected errors during submission', async () => {
      jest.spyOn(leadService, 'submitLead').mockRejectedValue(new Error('Unexpected error'));

      await expect(controller.submitLead(mockLead)).rejects.toThrow(
        new HttpException(
          createLeadProcessingError('An unexpected error occurred. Please try again later.'),
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should successfully submit a lead', async () => {
      jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation();
      jest.spyOn(leadService, 'submitLead').mockResolvedValue(true);

      const result = await controller.submitLead(mockLead);

      expect(result).toEqual({
        message: 'Lead submitted successfully',
        success: true,
      });
      expect(leadValidationService.validateLeadData).toHaveBeenCalledWith(mockLead);
      expect(leadService.submitLead).toHaveBeenCalledWith(mockLead);
    });

    it('should handle validation errors', async () => {
      const validationError = new HttpException(
        {
          message: 'Validation failed',
          errors: {
            email: ['Invalid email format'],
          },
        },
        HttpStatus.BAD_REQUEST,
      );

      jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
        throw validationError;
      });

      await expect(controller.submitLead(mockLead)).rejects.toThrow(validationError);
      expect(leadService.submitLead).not.toHaveBeenCalled();
    });

    it('should handle lead processing errors', async () => {
      jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation();
      jest.spyOn(leadService, 'submitLead').mockResolvedValue(false);

      await expect(controller.submitLead(mockLead)).rejects.toThrow(
        new HttpException(
          createLeadProcessingError('Failed to process lead submission'),
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle unexpected errors', async () => {
      jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation();
      jest.spyOn(leadService, 'submitLead').mockRejectedValue(new Error('Unexpected error'));

      await expect(controller.submitLead(mockLead)).rejects.toThrow(
        new HttpException(
          createLeadProcessingError('An unexpected error occurred. Please try again later.'),
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle concurrent lead submissions', async () => {
      jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation();
      jest
        .spyOn(leadService, 'submitLead')
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(true), 100)));

      const submissions = Array(5)
        .fill(mockLead)
        .map(() => controller.submitLead(mockLead));
      const results = await Promise.all(submissions);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toEqual({
          message: 'Lead submitted successfully',
          success: true,
        });
      });
      expect(leadService.submitLead).toHaveBeenCalledTimes(5);
      expect(leadValidationService.validateLeadData).toHaveBeenCalledTimes(5);
    });
  });

  describe('submitLead validation scenarios', () => {
    beforeEach(() => {
      jest.spyOn(leadService, 'submitLead').mockResolvedValue(true);
      jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('services validation', () => {
      it('should validate minimum and maximum services', async () => {
        const noServicesLead: LeadDto = {
          ...mockLead,
          services: [], // Should fail min size
        };

        const tooManyServicesLead: LeadDto = {
          ...mockLead,
          services: Array(11).fill(ServiceType.WEB_APP), // Should fail max size
        };

        jest
          .spyOn(leadValidationService, 'validateLeadData')
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Please select at least one service'] },
              HttpStatus.BAD_REQUEST,
            );
          })
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Maximum of 10 services can be selected'] },
              HttpStatus.BAD_REQUEST,
            );
          });

        await expect(controller.submitLead(noServicesLead)).rejects.toThrow(HttpException);
        await expect(controller.submitLead(tooManyServicesLead)).rejects.toThrow(HttpException);
      });

      it('should validate invalid service types', async () => {
        const invalidServiceLead: LeadDto = {
          ...mockLead,
          services: ['INVALID_SERVICE' as ServiceType],
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            { message: 'Validation failed', errors: ['One or more invalid service types selected'] },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(invalidServiceLead)).rejects.toThrow(HttpException);
      });
    });

    describe('project type and challenge validation', () => {
      it('should require existingProjectChallenges for existing projects', async () => {
        const existingProjectNoChallenge: LeadDto = {
          ...mockLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: undefined,
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            {
              message: 'Validation failed',
              errors: {
                existingProjectChallenges: ['Please specify at least one challenge for your existing project'],
              },
            },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(existingProjectNoChallenge)).rejects.toThrow(HttpException);
      });

      it('should validate maximum number of challenges', async () => {
        const tooManyChallenges: LeadDto = {
          ...mockLead,
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

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            {
              message: 'Validation failed',
              errors: {
                existingProjectChallenges: ['Maximum of 5 challenges can be selected'],
              },
            },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(tooManyChallenges)).rejects.toThrow(HttpException);
      });

      it('should validate challenge enum values', async () => {
        const invalidChallenge: LeadDto = {
          ...mockLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: ['INVALID_CHALLENGE' as ExistingProjectChallenge],
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            {
              message: 'Validation failed',
              errors: {
                existingProjectChallenges: ['One or more invalid project challenges selected'],
              },
            },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(invalidChallenge)).rejects.toThrow(HttpException);
      });

      it('should not require existingProjectChallenges for new projects', async () => {
        const newProjectNoChallenge: LeadDto = {
          ...mockLead,
          projectType: ProjectType.NEW,
          existingProjectChallenges: undefined,
        };

        const result = await controller.submitLead(newProjectNoChallenge);
        expect(result.success).toBe(true);
      });

      it('should successfully submit with multiple challenges', async () => {
        const multipleChallengeLead: LeadDto = {
          ...mockLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: [
            ExistingProjectChallenge.PERFORMANCE,
            ExistingProjectChallenge.SCALABILITY,
            ExistingProjectChallenge.UX,
          ],
          projectDescription: 'Project with multiple challenges to address',
        };

        const result = await controller.submitLead(multipleChallengeLead);
        expect(result.success).toBe(true);
      });
    });

    describe('project description validation', () => {
      it('should validate project description length', async () => {
        const shortDescription: LeadDto = {
          ...mockLead,
          projectDescription: 'hi', // Less than 5 chars
        };

        const longDescription: LeadDto = {
          ...mockLead,
          projectDescription: 'a'.repeat(2001), // Exceeds 2000 chars
        };

        jest
          .spyOn(leadValidationService, 'validateLeadData')
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Project description must be at least 5 characters'] },
              HttpStatus.BAD_REQUEST,
            );
          })
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Project description cannot exceed 2000 characters'] },
              HttpStatus.BAD_REQUEST,
            );
          });

        await expect(controller.submitLead(shortDescription)).rejects.toThrow(HttpException);
        await expect(controller.submitLead(longDescription)).rejects.toThrow(HttpException);
      });
    });

    describe('competitors validation', () => {
      it('should validate competitors when hasCompetitors is true', async () => {
        const noCompetitorsLead: LeadDto = {
          ...mockLead,
          hasCompetitors: true,
          competitorUrls: [], // Should fail min size
        };

        const tooManyCompetitorsLead: LeadDto = {
          ...mockLead,
          hasCompetitors: true,
          competitorUrls: Array(6).fill('competitor.com'), // Should fail max size
        };

        const longCompetitorUrlLead: LeadDto = {
          ...mockLead,
          hasCompetitors: true,
          competitorUrls: ['a'.repeat(201)], // Exceeds 200 chars
        };

        jest
          .spyOn(leadValidationService, 'validateLeadData')
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Please provide at least one competitor'] },
              HttpStatus.BAD_REQUEST,
            );
          })
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Maximum of 5 competitors allowed'] },
              HttpStatus.BAD_REQUEST,
            );
          })
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Each competitor name/URL cannot exceed 200 characters'] },
              HttpStatus.BAD_REQUEST,
            );
          });

        await expect(controller.submitLead(noCompetitorsLead)).rejects.toThrow(HttpException);
        await expect(controller.submitLead(tooManyCompetitorsLead)).rejects.toThrow(HttpException);
        await expect(controller.submitLead(longCompetitorUrlLead)).rejects.toThrow(HttpException);
      });

      it('should not require competitors when hasCompetitors is false', async () => {
        const validLead: LeadDto = {
          ...mockLead,
          hasCompetitors: false,
          competitorUrls: undefined,
        };

        const result = await controller.submitLead(validLead);
        expect(result.success).toBe(true);
      });
    });

    describe('contact information validation', () => {
      it('should validate name length and format', async () => {
        const shortNameLead: LeadDto = {
          ...mockLead,
          name: 'a', // Less than 2 chars
        };

        const longNameLead: LeadDto = {
          ...mockLead,
          name: 'a'.repeat(101), // Exceeds 100 chars
        };

        jest
          .spyOn(leadValidationService, 'validateLeadData')
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Name must be at least 2 characters'] },
              HttpStatus.BAD_REQUEST,
            );
          })
          .mockImplementationOnce(() => {
            throw new HttpException(
              { message: 'Validation failed', errors: ['Name cannot exceed 100 characters'] },
              HttpStatus.BAD_REQUEST,
            );
          });

        await expect(controller.submitLead(shortNameLead)).rejects.toThrow(HttpException);
        await expect(controller.submitLead(longNameLead)).rejects.toThrow(HttpException);
      });

      it('should validate email format', async () => {
        const invalidEmailLead: LeadDto = {
          ...mockLead,
          email: 'invalid-email',
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            { message: 'Validation failed', errors: ['Please provide a valid email address'] },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(invalidEmailLead)).rejects.toThrow(HttpException);
      });

      it('should validate company name length', async () => {
        const longCompanyLead: LeadDto = {
          ...mockLead,
          company: 'a'.repeat(201), // Exceeds 200 chars
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            { message: 'Validation failed', errors: ['Company name cannot exceed 200 characters'] },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(longCompanyLead)).rejects.toThrow(HttpException);
      });
    });

    describe('additional notes validation', () => {
      it('should validate additional notes length', async () => {
        const longNotesLead: LeadDto = {
          ...mockLead,
          additionalNotes: 'a'.repeat(1001), // Exceeds 1000 chars
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            { message: 'Validation failed', errors: ['Additional notes cannot exceed 1000 characters'] },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(longNotesLead)).rejects.toThrow(HttpException);
      });
    });

    describe('enum validations', () => {
      it('should validate all enum fields', async () => {
        const invalidEnumsLead: LeadDto = {
          ...mockLead,
          services: ['INVALID_SERVICE' as ServiceType],
          targetAudience: 'INVALID' as TargetAudience,
          industry: 'INVALID' as Industry,
          designStyle: 'INVALID' as DesignStyle,
          timeline: 'INVALID' as Timeline,
          budget: 'INVALID' as Budget,
          preferredContactMethod: 'INVALID' as ContactMethod,
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            {
              message: 'Validation failed',
              errors: [
                'One or more invalid service types selected',
                'Please select a valid target audience',
                'Please select a valid industry',
                'Please select a valid design style',
                'Please select a valid timeline',
                'Please select a valid budget range',
                'Please select a valid contact method',
              ],
            },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(invalidEnumsLead)).rejects.toThrow(HttpException);
      });

      it('should validate project type specific enums', async () => {
        const invalidExistingProjectLead: LeadDto = {
          ...mockLead,
          projectType: ProjectType.EXISTING,
          existingProjectChallenges: ['INVALID' as ExistingProjectChallenge],
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            {
              message: 'Validation failed',
              errors: ['Please select a valid project challenge'],
            },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(invalidExistingProjectLead)).rejects.toThrow(HttpException);
      });
    });

    describe('boolean field validations', () => {
      it('should validate boolean fields are not null or undefined', async () => {
        const invalidBooleanLead: LeadDto = {
          ...mockLead,
          hasCompetitors: undefined as unknown as boolean,
          hasExistingBrand: undefined as unknown as boolean,
          wantsConsultation: undefined as unknown as boolean,
        };

        jest.spyOn(leadValidationService, 'validateLeadData').mockImplementation(() => {
          throw new HttpException(
            {
              message: 'Validation failed',
              errors: [
                'Please specify if you have competitors or inspiration',
                'Please specify if you have existing brand guidelines',
                'Please specify if you want a free consultation',
              ],
            },
            HttpStatus.BAD_REQUEST,
          );
        });

        await expect(controller.submitLead(invalidBooleanLead)).rejects.toThrow(HttpException);
      });
    });
  });

  describe('getAllLeads', () => {
    it('should return all leads', async () => {
      const mockLeads = [mockLeadResponse];
      jest.spyOn(leadService, 'findAll').mockResolvedValue(mockLeads as LeadResponseDto[]);

      const result = await controller.getAllLeads();

      expect(result).toEqual(mockLeads);
      expect(leadService.findAll).toHaveBeenCalled();
    });

    it('should handle errors when getting all leads', async () => {
      jest.spyOn(leadService, 'findAll').mockRejectedValue(new Error('Database error'));

      await expect(controller.getAllLeads()).rejects.toThrow();
    });
  });

  describe('getLeadById', () => {
    it('should return a lead by id', async () => {
      jest.spyOn(leadService, 'findOne').mockResolvedValue(mockLeadResponse as LeadResponseDto);

      const result = await controller.getLeadById('test-id');

      expect(result).toEqual(mockLeadResponse);
      expect(leadService.findOne).toHaveBeenCalledWith('test-id');
    });

    it('should handle errors when lead is not found', async () => {
      jest.spyOn(leadService, 'findOne').mockRejectedValue(new Error('Lead not found'));

      await expect(controller.getLeadById('non-existent-id')).rejects.toThrow();
    });
  });
});
