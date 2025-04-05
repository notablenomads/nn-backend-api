import {
  IsString,
  IsEmail,
  IsEnum,
  IsArray,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  ValidateIf,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ServiceType,
  ProjectType,
  ExistingProjectChallenge,
  TargetAudience,
  Industry,
  DesignStyle,
  Timeline,
  Budget,
  ContactMethod,
  MobileAppPlatform,
  AIMLDatasetStatus,
  TechnicalExpertise,
  TechnicalFeature,
} from '../enums/lead.enum';

export class LeadDto {
  @ApiProperty({
    description: 'Selected services for the project',
    enum: ServiceType,
    isArray: true,
  })
  @IsArray({ message: 'Services must be provided as an array' })
  @ArrayMinSize(1, { message: 'Please select at least one service' })
  @ArrayMaxSize(10, { message: 'Maximum of 10 services can be selected' })
  @IsEnum(ServiceType, { each: true, message: 'One or more invalid service types selected' })
  services: ServiceType[];

  @ApiProperty({
    description: 'Type of project (new or existing)',
    enum: ProjectType,
  })
  @IsNotEmpty({ message: 'Project type is required' })
  @IsEnum(ProjectType, { message: 'Please select a valid project type' })
  projectType: ProjectType;

  @ApiProperty({
    description: 'Main challenges with existing project',
    enum: ExistingProjectChallenge,
    isArray: true,
    required: false,
  })
  @ValidateIf((o) => o.projectType === ProjectType.EXISTING)
  @IsArray({ message: 'Project challenges must be provided as an array' })
  @ArrayMinSize(1, { message: 'Please specify at least one challenge for your existing project' })
  @ArrayMaxSize(8, { message: 'Maximum of 8 challenges can be selected' })
  @IsEnum(ExistingProjectChallenge, { each: true, message: 'Please select valid project challenges' })
  existingProjectChallenges?: ExistingProjectChallenge[];

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Building a marketplace app for local artisans',
  })
  @ValidateIf((o) => o.technicalExpertise === TechnicalExpertise.NON_TECHNICAL)
  @IsString({ message: 'Project description must be text' })
  @MinLength(10, { message: 'Please provide a more detailed description (minimum 10 characters)' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  projectDescription?: string;

  @ApiProperty({
    description: 'Target audience',
    enum: TargetAudience,
  })
  @IsNotEmpty({ message: 'Target audience is required' })
  @IsEnum(TargetAudience, { message: 'Please select a valid target audience' })
  targetAudience: TargetAudience;

  @ApiProperty({
    description: 'Industry',
    enum: Industry,
  })
  @IsNotEmpty({ message: 'Industry is required' })
  @IsEnum(Industry, { message: 'Please select a valid industry' })
  industry: Industry;

  @ApiProperty({
    description: 'Has competitors or inspiration',
    type: Boolean,
  })
  @IsNotEmpty({ message: 'Please specify if you have competitors or inspiration' })
  @IsBoolean({ message: 'Has competitors must be true or false' })
  hasCompetitors: boolean;

  @ApiProperty({
    description: 'Competitor URLs or names',
    required: false,
    type: [String],
    example: ['www.competitor.com', 'Competitor Name Inc.'],
  })
  @ValidateIf((o) => o.hasCompetitors === true)
  @IsArray({ message: 'Competitors must be provided as a list' })
  @ArrayMinSize(1, { message: 'Please provide at least one competitor' })
  @ArrayMaxSize(5, { message: 'Maximum of 5 competitors allowed' })
  @IsString({ each: true, message: 'Each competitor must be text' })
  @MaxLength(200, { each: true, message: 'Each competitor name/URL cannot exceed 200 characters' })
  competitorUrls?: string[];

  @ApiProperty({
    description: 'Has existing brand guidelines',
    type: Boolean,
  })
  @IsNotEmpty({ message: 'Please specify if you have existing brand guidelines' })
  @IsBoolean({ message: 'Has existing brand must be true or false' })
  hasExistingBrand: boolean;

  @ApiProperty({
    description: 'Preferred design style',
    enum: DesignStyle,
  })
  @IsNotEmpty({ message: 'Design style is required' })
  @IsEnum(DesignStyle, { message: 'Please select a valid design style' })
  designStyle: DesignStyle;

  @ApiProperty({
    description: 'Project timeline',
    enum: Timeline,
  })
  @IsNotEmpty({ message: 'Timeline is required' })
  @IsEnum(Timeline, { message: 'Please select a valid timeline' })
  timeline: Timeline;

  @ApiProperty({
    description: 'Project budget',
    enum: Budget,
  })
  @IsNotEmpty({ message: 'Budget is required' })
  @IsEnum(Budget, { message: 'Please select a valid budget range' })
  budget: Budget;

  @ApiPropertyOptional({
    description: 'Target platform for mobile app',
    enum: MobileAppPlatform,
  })
  @ValidateIf((o) => o.services?.includes(ServiceType.MOBILE_APP))
  @IsNotEmpty({ message: 'Please select a target platform for your mobile app' })
  @IsEnum(MobileAppPlatform, { message: 'Please select a valid mobile app platform' })
  mobileAppPlatform?: MobileAppPlatform;

  @ApiPropertyOptional({
    description: 'Status of AI/ML datasets/models',
    enum: AIMLDatasetStatus,
  })
  @ValidateIf((o) => o.services?.includes(ServiceType.AI_ML))
  @IsNotEmpty({ message: 'Please indicate if you have datasets/models for your AI/ML project' })
  @IsEnum(AIMLDatasetStatus, { message: 'Please select a valid dataset status' })
  aimlDatasetStatus?: AIMLDatasetStatus;

  @ApiProperty({
    description: 'Contact name',
    example: 'John Doe',
  })
  @IsString({ message: 'Name must be text' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Contact email',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Contact phone number',
    required: false,
    example: '+1234567890',
  })
  @ValidateIf(
    (o) => o.preferredContactMethod === ContactMethod.PHONE || o.preferredContactMethod === ContactMethod.WHATSAPP,
  )
  @IsString({ message: 'Phone number must be text' })
  @IsNotEmpty({ message: 'Phone number is required when contact method is Phone or WhatsApp' })
  @MinLength(10, { message: 'Phone number must be at least 10 characters' })
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  @Matches(/^\+?[0-9\s-()]+$/, {
    message: 'Phone number can only contain numbers, spaces, hyphens, parentheses, and optionally start with +',
  })
  phone: string;

  @ApiProperty({
    description: 'Company name',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Company name must be text' })
  @MaxLength(200, { message: 'Company name cannot exceed 200 characters' })
  company?: string;

  @ApiProperty({
    description: 'Preferred contact method',
    enum: ContactMethod,
  })
  @IsNotEmpty({ message: 'Contact method is required' })
  @IsEnum(ContactMethod, { message: 'Please select a valid contact method' })
  preferredContactMethod: ContactMethod;

  @ApiProperty({
    description: 'Wants free consultation',
    type: Boolean,
  })
  @IsNotEmpty({ message: 'Please specify if you want a free consultation' })
  @IsBoolean({ message: 'Wants consultation must be true or false' })
  wantsConsultation: boolean;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Additional notes must be text' })
  @MaxLength(1000, { message: 'Additional notes cannot exceed 1000 characters' })
  additionalNotes?: string;

  @ApiProperty({
    description: 'Technical expertise level',
    enum: TechnicalExpertise,
    required: true,
  })
  @IsNotEmpty({ message: 'Please specify your technical expertise' })
  @IsEnum(TechnicalExpertise, { message: 'Invalid technical expertise value' })
  technicalExpertise: TechnicalExpertise;

  @ApiProperty({
    description: 'Technical features needed',
    enum: TechnicalFeature,
    isArray: true,
    required: false,
  })
  @ValidateIf((o) => o.technicalExpertise === TechnicalExpertise.TECHNICAL)
  @IsArray({ message: 'Technical features must be provided as an array' })
  @ArrayMinSize(1, { message: 'Please select at least one technical feature' })
  @ArrayMaxSize(25, { message: 'Maximum of 25 features can be selected' })
  @IsEnum(TechnicalFeature, { each: true, message: 'One or more invalid technical features selected' })
  technicalFeatures?: TechnicalFeature[];
}
