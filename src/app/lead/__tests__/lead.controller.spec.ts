import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { LeadController } from '../lead.controller';
import { LeadService } from '../lead.service';
import { LeadValidationService } from '../services/lead-validation.service';
import { LeadDto } from '../dto/lead.dto';
import { LeadResponseDto } from '../interfaces/lead-response.dto';
import {
  ProjectType,
  ServiceType,
  TargetAudience,
  Industry,
  DesignStyle,
  Timeline,
  Budget,
  ContactMethod,
} from '../enums/lead.enum';
import { createLeadProcessingError } from '../constants/lead.errors';

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
    hasExistingBrand: false,
    designStyle: DesignStyle.MODERN,
    timeline: Timeline.LESS_THAN_3_MONTHS,
    budget: Budget.LESS_THAN_10K,
    name: 'John Doe',
    email: 'john@example.com',
    preferredContactMethod: ContactMethod.EMAIL,
    wantsConsultation: true,
  };

  const mockLeadResponse = {
    ...mockLead,
    id: 'test-id',
    createdAt: new Date(),
    updatedAt: new Date(),
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
      ],
    }).compile();

    controller = module.get<LeadController>(LeadController);
    leadService = module.get<LeadService>(LeadService);
    leadValidationService = module.get<LeadValidationService>(LeadValidationService);
  });

  describe('submitLead', () => {
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
