import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
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
import { ILead } from '../interfaces/lead.interface';
import { User } from '../../user/entities/user.entity';

@Entity('leads')
export class Lead implements ILead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { array: true })
  services: ServiceType[];

  @Column({
    type: 'enum',
    enum: ProjectType,
  })
  projectType: ProjectType;

  @Column({
    type: 'enum',
    enum: ExistingProjectChallenge,
    array: true,
    nullable: true,
  })
  existingProjectChallenges?: ExistingProjectChallenge[];

  @Column('text', { nullable: true })
  projectDescription?: string;

  @Column({
    type: 'enum',
    enum: TargetAudience,
  })
  targetAudience: TargetAudience;

  @Column({
    type: 'enum',
    enum: Industry,
  })
  industry: Industry;

  @Column('boolean')
  hasCompetitors: boolean;

  @Column('text', { array: true, nullable: true })
  competitorUrls?: string[];

  @Column('boolean')
  hasExistingBrand: boolean;

  @Column({
    type: 'enum',
    enum: DesignStyle,
  })
  designStyle: DesignStyle;

  @Column({
    type: 'enum',
    enum: Timeline,
  })
  timeline: Timeline;

  @Column({
    type: 'enum',
    enum: Budget,
  })
  budget: Budget;

  @Column('text')
  name: string;

  @Column('text')
  email: string;

  @Column('text', { nullable: true })
  phone?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({
    type: 'enum',
    enum: ContactMethod,
  })
  preferredContactMethod: ContactMethod;

  @Column('boolean')
  wantsConsultation: boolean;

  @Column('text', { nullable: true })
  additionalNotes?: string;

  @Column({
    type: 'enum',
    enum: MobileAppPlatform,
    nullable: true,
  })
  mobileAppPlatform?: MobileAppPlatform;

  @Column({
    type: 'enum',
    enum: AIMLDatasetStatus,
    nullable: true,
  })
  aimlDatasetStatus?: AIMLDatasetStatus;

  @Column({
    type: 'enum',
    enum: TechnicalExpertise,
  })
  technicalExpertise: TechnicalExpertise;

  @Column({
    type: 'enum',
    enum: TechnicalFeature,
    array: true,
    nullable: true,
  })
  technicalFeatures?: TechnicalFeature[];

  @ManyToOne(() => User, (user) => user.leads)
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
