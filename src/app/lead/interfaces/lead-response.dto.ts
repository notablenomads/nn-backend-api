import { ApiProperty } from '@nestjs/swagger';
import { ILead } from './lead.interface';
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

export class LeadResponseDto implements ILead {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ServiceType, isArray: true })
  services: ServiceType[];

  @ApiProperty({ enum: ProjectType })
  projectType: ProjectType;

  @ApiProperty({ enum: ExistingProjectChallenge, required: false })
  existingProjectChallenge?: ExistingProjectChallenge;

  @ApiProperty()
  projectDescription: string;

  @ApiProperty({ enum: TargetAudience })
  targetAudience: TargetAudience;

  @ApiProperty({ enum: Industry })
  industry: Industry;

  @ApiProperty()
  hasCompetitors: boolean;

  @ApiProperty({ required: false, type: [String] })
  competitorUrls?: string[];

  @ApiProperty()
  hasExistingBrand: boolean;

  @ApiProperty({ enum: DesignStyle })
  designStyle: DesignStyle;

  @ApiProperty({ enum: Timeline })
  timeline: Timeline;

  @ApiProperty({ enum: Budget })
  budget: Budget;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  company?: string;

  @ApiProperty({ enum: ContactMethod })
  preferredContactMethod: ContactMethod;

  @ApiProperty()
  wantsConsultation: boolean;

  @ApiProperty({ required: false })
  additionalNotes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
