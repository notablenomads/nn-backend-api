import { Repository } from 'typeorm';
import { SESClient, SendEmailCommandOutput } from '@aws-sdk/client-ses';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeadService } from '../lead.service';
import { Lead } from '../entities/lead.entity';
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
import { ERRORS } from '../../core/errors/errors';

jest.mock('@aws-sdk/client-ses');

describe('LeadService', () => {
  let service: LeadService;
  let leadRepository: Repository<Lead>;
  let mockSESClient: jest.Mocked<SESClient>;

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

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'aws.region': 'us-east-1',
        'aws.accessKeyId': 'test-key',
        'aws.secretAccessKey': 'test-secret',
        'email.fromAddress': 'from@test.com',
        'email.toAddress': 'to@test.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const mockSendEmailOutput: SendEmailCommandOutput = {
      MessageId: 'test-message-id',
      $metadata: {},
    };

    mockSESClient = {
      send: jest.fn().mockResolvedValue(mockSendEmailOutput),
    } as unknown as jest.Mocked<SESClient>;

    (SESClient as jest.Mock).mockImplementation(() => mockSESClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadService,
        {
          provide: getRepositoryToken(Lead),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOneOrFail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LeadService>(LeadService);
    leadRepository = module.get<Repository<Lead>>(getRepositoryToken(Lead));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should throw error if AWS credentials are missing', async () => {
      const mockConfigWithoutAWS = {
        get: jest.fn((key: string) => {
          const config = {
            'email.fromAddress': 'from@test.com',
            'email.toAddress': 'to@test.com',
          };
          return config[key];
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            LeadService,
            {
              provide: getRepositoryToken(Lead),
              useClass: Repository,
            },
            {
              provide: ConfigService,
              useValue: mockConfigWithoutAWS,
            },
          ],
        }).compile(),
      ).rejects.toThrow(ERRORS.GENERIC.MISSING_CONFIG({ configName: 'AWS credentials' }).message);
    });

    it('should throw error if email to address is missing', async () => {
      const mockConfigWithoutEmail = {
        get: jest.fn((key: string) => {
          const config = {
            'aws.region': 'us-east-1',
            'aws.accessKeyId': 'test-key',
            'aws.secretAccessKey': 'test-secret',
            'email.fromAddress': 'from@test.com',
          };
          return config[key];
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            LeadService,
            {
              provide: getRepositoryToken(Lead),
              useClass: Repository,
            },
            {
              provide: ConfigService,
              useValue: mockConfigWithoutEmail,
            },
          ],
        }).compile(),
      ).rejects.toThrow(ERRORS.GENERIC.MISSING_CONFIG({ configName: 'EMAIL_TO_ADDRESS' }).message);
    });
  });

  describe('submitLead', () => {
    it('should successfully submit a lead and send notifications', async () => {
      const createSpy = jest.spyOn(leadRepository, 'create').mockReturnValue(mockLead as Lead);
      const saveSpy = jest.spyOn(leadRepository, 'save').mockResolvedValue({ ...mockLead, id: 'test-id' } as Lead);

      const result = await service.submitLead(mockLead);

      expect(result).toBe(true);
      expect(createSpy).toHaveBeenCalledWith(mockLead);
      expect(saveSpy).toHaveBeenCalled();
      expect(mockSESClient.send).toHaveBeenCalledTimes(2); // Admin and user notifications
    });

    it('should handle errors during lead submission', async () => {
      jest.spyOn(leadRepository, 'save').mockRejectedValue(new Error('Database error'));

      const result = await service.submitLead(mockLead);

      expect(result).toBe(false);
    });

    it('should retry admin email sending on failure', async () => {
      const mockLeadWithId = { ...mockLead, id: 'test-id' } as Lead;
      jest.spyOn(leadRepository, 'create').mockReturnValue(mockLeadWithId);
      jest.spyOn(leadRepository, 'save').mockResolvedValue(mockLeadWithId);
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');

      const mockError = new Error('Email error');

      // Mock both admin and user email attempts
      let callCount = 0;
      (mockSESClient.send as jest.Mock).mockImplementation(() => {
        callCount++;
        switch (callCount) {
          case 1: // First admin attempt fails
            return Promise.reject(mockError);
          case 2: // Second admin attempt fails
            return Promise.reject(mockError);
          case 3: // Third admin attempt fails
            return Promise.reject(mockError);
          case 4: // User email fails
            return Promise.reject(mockError);
          default:
            return Promise.reject(new Error('Unexpected call'));
        }
      });

      const submitPromise = service.submitLead(mockLead);

      // Run all timers to complete all retries
      await jest.runAllTimersAsync();

      const result = await submitPromise;

      expect(result).toBe(false); // False because both admin and user emails failed
      expect(mockSESClient.send).toHaveBeenCalledTimes(4); // 3 admin attempts + 1 user attempt
      expect(setTimeout).toHaveBeenCalledTimes(2); // 2 retries for admin email
      expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 1000); // First retry delay
      expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 2000); // Second retry delay

      jest.useRealTimers();
    });
  });

  describe('findAll', () => {
    it('should return all leads ordered by creation date', async () => {
      const mockLeads = [
        { ...mockLead, id: '1', createdAt: new Date(), updatedAt: new Date() },
        { ...mockLead, id: '2', createdAt: new Date(), updatedAt: new Date() },
      ] as Lead[];

      jest.spyOn(leadRepository, 'find').mockResolvedValue(mockLeads);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(LeadResponseDto);
      expect(result[0].id).toBe('1');
    });
  });

  describe('findOne', () => {
    it('should return a single lead by id', async () => {
      const mockLeadWithId = { ...mockLead, id: 'test-id', createdAt: new Date(), updatedAt: new Date() } as Lead;

      jest.spyOn(leadRepository, 'findOneOrFail').mockResolvedValue(mockLeadWithId);

      const result = await service.findOne('test-id');

      expect(result).toBeInstanceOf(LeadResponseDto);
      expect(result.id).toBe('test-id');
    });

    it('should throw error when lead is not found', async () => {
      jest.spyOn(leadRepository, 'findOneOrFail').mockRejectedValue(new Error('Not found'));

      await expect(service.findOne('non-existent-id')).rejects.toThrow();
    });
  });
});
