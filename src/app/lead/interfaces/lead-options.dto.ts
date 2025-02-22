import { ApiProperty } from '@nestjs/swagger';

export class EnumOptionDto {
  @ApiProperty()
  value: string;

  @ApiProperty()
  label: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class LeadOptionsDto {
  @ApiProperty({ type: [EnumOptionDto] })
  services: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  projectTypes: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  existingProjectChallenges: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  targetAudiences: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  industries: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  designStyles: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  timelines: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  budgets: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  contactMethods: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  technicalExpertise: EnumOptionDto[];

  @ApiProperty({ type: [EnumOptionDto] })
  technicalFeatures: EnumOptionDto[];
}
