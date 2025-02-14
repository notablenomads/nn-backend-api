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
    description: 'Main challenge with existing project',
    enum: ExistingProjectChallenge,
    required: false,
  })
  @ValidateIf((o) => o.projectType === ProjectType.EXISTING)
  @IsNotEmpty({ message: 'Please specify the main challenge for your existing project' })
  @IsEnum(ExistingProjectChallenge, { message: 'Please select a valid project challenge' })
  existingProjectChallenge?: ExistingProjectChallenge;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Building a marketplace app for local artisans',
  })
  @IsOptional()
  @IsString({ message: 'Project description must be text' })
  @MinLength(5, { message: 'Project description must be at least 5 characters' })
  @MaxLength(2000, { message: 'Project description cannot exceed 2000 characters' })
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
}
