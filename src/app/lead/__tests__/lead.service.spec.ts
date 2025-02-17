import 'reflect-metadata';

import { SESClient } from '@aws-sdk/client-ses';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LeadService } from '../lead.service';
import { Lead } from '../entities/lead.entity';
import { LeadDto } from '../dto/lead.dto';
import {
  ProjectType,
  ExistingProjectChallenge,
  ServiceType,
  TargetAudience,
  Industry,
  DesignStyle,
  Budget,
  Timeline,
  ContactMethod,
} from '../enums/lead.enum';

jest.mock('../../core/errors/errors', () => ({
  ERRORS: {
    GENERIC: {
      missingConfig: ({ configName }: { configName: string }) => ({
        message: `Missing required config: ${configName}`,
      }),
    },
    LEAD: {
      notFound: () => ({
        message: 'Lead not found',
      }),
    },
  },
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-logo-content')),
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from('fake-logo-content')),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('@nestjs/typeorm', () => ({
  injectRepository: () => () => {},
  getRepositoryToken: jest.fn().mockReturnValue('MockRepositoryToken'),
}));

jest.mock('typeorm', () => {
  const decoratorFn = () => () => {};
  return {
    Repository: jest.fn(),
    Entity: decoratorFn,
    Column: decoratorFn,
    PrimaryGeneratedColumn: decoratorFn,
    CreateDateColumn: decoratorFn,
    UpdateDateColumn: decoratorFn,
    OneToMany: decoratorFn,
    ManyToOne: decoratorFn,
    JoinColumn: decoratorFn,
    BeforeInsert: decoratorFn,
    BeforeUpdate: decoratorFn,
  };
});

describe('LeadService', () => {
  let service: LeadService;
  let leadRepository: Repository<Lead>;
  let mockSESClient: jest.Mocked<SESClient>;

  const mockLead: LeadDto = {
    projectType: ProjectType.EXISTING,
    existingProjectChallenges: [ExistingProjectChallenge.PERFORMANCE, ExistingProjectChallenge.SCALABILITY],
    projectDescription: 'Test project',
    services: [ServiceType.WEB_APP],
    targetAudience: TargetAudience.BUSINESSES,
    industry: Industry.SAAS,
    hasCompetitors: false,
    competitorUrls: [],
    hasExistingBrand: false,
    designStyle: DesignStyle.MODERN,
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Test Company',
    budget: Budget.LESS_THAN_10K,
    timeline: Timeline.LESS_THAN_3_MONTHS,
    preferredContactMethod: ContactMethod.EMAIL,
    wantsConsultation: true,
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn().mockImplementation((dto) => ({
        ...dto,
        id: 'test-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest.fn().mockImplementation((entity) =>
        Promise.resolve({
          ...entity,
          id: 'test-id',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      findOne: jest.fn().mockImplementation((options) =>
        Promise.resolve(
          options?.where?.id === 'not-found'
            ? null
            : {
                ...mockLead,
                id: options?.where?.id || 'test-id',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
        ),
      ),
      find: jest.fn().mockImplementation(() =>
        Promise.resolve([
          {
            ...mockLead,
            id: 'test-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      ),
      target: Lead,
      manager: {},
      metadata: {},
      createQueryBuilder: jest.fn(),
      hasId: jest.fn(),
      getId: jest.fn(),
      clear: jest.fn(),
      remove: jest.fn(),
      softRemove: jest.fn(),
      recover: jest.fn(),
      count: jest.fn(),
      sum: jest.fn(),
      average: jest.fn(),
      min: jest.fn(),
      max: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      merge: jest.fn(),
      preload: jest.fn(),
      query: jest.fn(),
      extend: jest.fn(),
    } as unknown as Repository<Lead>;

    mockSESClient = {
      send: jest.fn().mockResolvedValue({}),
    } as any;

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          'aws.region': 'test-region',
          'aws.accessKeyId': 'test-access-key',
          'aws.secretAccessKey': 'test-secret-key',
          'email.toAddress': 'test@example.com',
          'email.fromAddress': 'test@example.com',
        };
        return config[key];
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        const config = {
          'aws.region': 'test-region',
          'aws.accessKeyId': 'test-access-key',
          'aws.secretAccessKey': 'test-secret-key',
          'email.toAddress': 'test@example.com',
          'email.fromAddress': 'test@example.com',
        };
        return config[key];
      }),
      internalConfig: {},
      isCacheEnabled: false,
      skipProcessEnv: false,
      cache: {},
    } as unknown as ConfigService;

    service = new LeadService(mockRepository, mockConfigService, mockSESClient);
    leadRepository = mockRepository;
  });

  describe('create', () => {
    it('should create a new lead', async () => {
      const result = await service.create(mockLead);
      expect(result).toEqual(expect.objectContaining({ ...mockLead, id: 'test-id' }));
      expect(leadRepository.create).toHaveBeenCalledWith(mockLead);
      expect(leadRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all leads', async () => {
      const result = await service.findAll();
      expect(result).toEqual([expect.objectContaining({ ...mockLead, id: 'test-id' })]);
      expect(leadRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a lead by id', async () => {
      const result = await service.findOne('test-id');
      expect(result).toEqual(expect.objectContaining({ ...mockLead, id: 'test-id' }));
      expect(leadRepository.findOne).toHaveBeenCalledWith({ where: { id: 'test-id' } });
    });

    it('should throw error when lead is not found', async () => {
      jest.spyOn(leadRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow();
    });
  });
});
