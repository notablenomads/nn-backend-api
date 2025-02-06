import {
  IsString,
  IsEmail,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  IsUrl,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @IsArray({ message: 'Services must be provided as an array' })
  @ArrayMinSize(1, { message: 'At least one service must be selected' })
  @ArrayMaxSize(5, { message: 'Maximum of 5 services can be selected' })
  @IsEnum(ServiceType, { each: true, message: 'Invalid service type selected' })
  services: ServiceType[];

  @ApiProperty({
    description: 'Type of project (new or existing)',
    enum: ProjectType,
  })
  @IsNotEmpty({ message: 'Project type is required' })
  @IsEnum(ProjectType, { message: 'Invalid project type selected' })
  projectType: ProjectType;

  @ApiProperty({
    description: 'Main challenge with existing project',
    enum: ExistingProjectChallenge,
    required: false,
  })
  @ValidateIf((o) => o.projectType === ProjectType.EXISTING)
  @IsNotEmpty({ message: 'Challenge must be specified for existing projects' })
  @IsEnum(ExistingProjectChallenge, { message: 'Invalid project challenge selected' })
  existingProjectChallenge?: ExistingProjectChallenge;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Building a marketplace app for local artisans',
  })
  @IsOptional()
  @IsString({ message: 'Project description must be a string' })
  @MinLength(20, { message: 'Project description must be at least 50 characters long' })
  @MaxLength(2000, { message: 'Project description cannot exceed 2000 characters' })
  projectDescription: string;

  @ApiProperty({
    description: 'Target audience',
    enum: TargetAudience,
  })
  @IsNotEmpty({ message: 'Target audience is required' })
  @IsEnum(TargetAudience, { message: 'Invalid target audience selected' })
  targetAudience: TargetAudience;

  @ApiProperty({
    description: 'Industry',
    enum: Industry,
  })
  @IsNotEmpty({ message: 'Industry is required' })
  @IsEnum(Industry, { message: 'Invalid industry selected' })
  industry: Industry;

  @ApiProperty({
    description: 'Has competitors or inspiration',
    type: Boolean,
  })
  @IsBoolean({ message: 'Has competitors must be a boolean value' })
  hasCompetitors: boolean;

  @ApiProperty({
    description: 'Competitor URLs',
    required: false,
    type: [String],
  })
  @ValidateIf((o) => o.hasCompetitors === true)
  @IsArray({ message: 'Competitor URLs must be provided as an array' })
  @ArrayMinSize(1, { message: 'At least one competitor URL must be provided when hasCompetitors is true' })
  @ArrayMaxSize(5, { message: 'Maximum of 5 competitor URLs allowed' })
  @IsUrl({}, { each: true, message: 'Invalid URL format for competitor website' })
  competitorUrls?: string[];

  @ApiProperty({
    description: 'Has existing brand guidelines',
    type: Boolean,
  })
  @IsBoolean({ message: 'Has existing brand must be a boolean value' })
  hasExistingBrand: boolean;

  @ApiProperty({
    description: 'Preferred design style',
    enum: DesignStyle,
  })
  @IsNotEmpty({ message: 'Design style is required' })
  @IsEnum(DesignStyle, { message: 'Invalid design style selected' })
  designStyle: DesignStyle;

  @ApiProperty({
    description: 'Project timeline',
    enum: Timeline,
  })
  @IsNotEmpty({ message: 'Timeline is required' })
  @IsEnum(Timeline, { message: 'Invalid timeline selected' })
  timeline: Timeline;

  @ApiProperty({
    description: 'Project budget',
    enum: Budget,
  })
  @IsNotEmpty({ message: 'Budget is required' })
  @IsEnum(Budget, { message: 'Invalid budget selected' })
  budget: Budget;

  @ApiProperty({
    description: 'Contact name',
    example: 'John Doe',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Company name',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Company name must be a string' })
  @MaxLength(200, { message: 'Company name cannot exceed 200 characters' })
  company?: string;

  @ApiProperty({
    description: 'Preferred contact method',
    enum: ContactMethod,
  })
  @IsNotEmpty({ message: 'Preferred contact method is required' })
  @IsEnum(ContactMethod, { message: 'Invalid contact method selected' })
  preferredContactMethod: ContactMethod;

  @ApiProperty({
    description: 'Wants free consultation',
    type: Boolean,
  })
  @IsBoolean({ message: 'Wants consultation must be a boolean value' })
  wantsConsultation: boolean;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Additional notes must be a string' })
  @MaxLength(1000, { message: 'Additional notes cannot exceed 1000 characters' })
  additionalNotes?: string;
}
