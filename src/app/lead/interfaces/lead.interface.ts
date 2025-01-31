import { IsString, IsEmail, IsEnum, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ServiceType {
  WEB_APP = 'WEB_APP',
  MOBILE_APP = 'MOBILE_APP',
  AI_ML = 'AI_ML',
  DEVOPS = 'DEVOPS',
  ARCHITECTURE = 'ARCHITECTURE',
  OTHER = 'OTHER',
}

export enum ProjectType {
  NEW = 'NEW',
  EXISTING = 'EXISTING',
}

export enum ExistingProjectChallenge {
  PERFORMANCE = 'PERFORMANCE',
  SCALABILITY = 'SCALABILITY',
  BUGS = 'BUGS',
  UX = 'UX',
  OTHER = 'OTHER',
}

export enum TargetAudience {
  CONSUMERS = 'CONSUMERS',
  BUSINESSES = 'BUSINESSES',
  BOTH = 'BOTH',
}

export enum Industry {
  ECOMMERCE = 'ECOMMERCE',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  SAAS = 'SAAS',
  FINANCE = 'FINANCE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER',
}

export enum DesignStyle {
  MODERN = 'MODERN',
  BOLD = 'BOLD',
  PROFESSIONAL = 'PROFESSIONAL',
  UNDECIDED = 'UNDECIDED',
}

export enum Timeline {
  LESS_THAN_3_MONTHS = 'LESS_THAN_3_MONTHS',
  THREE_TO_SIX_MONTHS = 'THREE_TO_SIX_MONTHS',
  MORE_THAN_6_MONTHS = 'MORE_THAN_6_MONTHS',
  FLEXIBLE = 'FLEXIBLE',
}

export enum Budget {
  LESS_THAN_10K = 'LESS_THAN_10K',
  TEN_TO_FIFTY_K = 'TEN_TO_FIFTY_K',
  FIFTY_TO_HUNDRED_K = 'FIFTY_TO_HUNDRED_K',
  MORE_THAN_100K = 'MORE_THAN_100K',
  NOT_SURE = 'NOT_SURE',
}

export enum ContactMethod {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  WHATSAPP = 'WHATSAPP',
}

export class LeadDto {
  @ApiProperty({
    description: 'Selected services for the project',
    enum: ServiceType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  services: ServiceType[];

  @ApiProperty({
    description: 'Type of project (new or existing)',
    enum: ProjectType,
  })
  @IsEnum(ProjectType)
  projectType: ProjectType;

  @ApiProperty({
    description: 'Main challenge with existing project',
    enum: ExistingProjectChallenge,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExistingProjectChallenge)
  existingProjectChallenge?: ExistingProjectChallenge;

  @ApiProperty({
    description: 'Project description',
    example: 'Building a marketplace app for local artisans',
  })
  @IsString()
  projectDescription: string;

  @ApiProperty({
    description: 'Target audience',
    enum: TargetAudience,
  })
  @IsEnum(TargetAudience)
  targetAudience: TargetAudience;

  @ApiProperty({
    description: 'Industry',
    enum: Industry,
  })
  @IsEnum(Industry)
  industry: Industry;

  @ApiProperty({
    description: 'Has competitors or inspiration',
    type: Boolean,
  })
  @IsBoolean()
  hasCompetitors: boolean;

  @ApiProperty({
    description: 'Competitor URLs',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  competitorUrls?: string[];

  @ApiProperty({
    description: 'Has existing brand guidelines',
    type: Boolean,
  })
  @IsBoolean()
  hasExistingBrand: boolean;

  @ApiProperty({
    description: 'Preferred design style',
    enum: DesignStyle,
  })
  @IsEnum(DesignStyle)
  designStyle: DesignStyle;

  @ApiProperty({
    description: 'Project timeline',
    enum: Timeline,
  })
  @IsEnum(Timeline)
  timeline: Timeline;

  @ApiProperty({
    description: 'Project budget',
    enum: Budget,
  })
  @IsEnum(Budget)
  budget: Budget;

  @ApiProperty({
    description: 'Contact name',
    example: 'John Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Company name',
    required: false,
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    description: 'Preferred contact method',
    enum: ContactMethod,
  })
  @IsEnum(ContactMethod)
  preferredContactMethod: ContactMethod;

  @ApiProperty({
    description: 'Wants free consultation',
    type: Boolean,
  })
  @IsBoolean()
  wantsConsultation: boolean;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
