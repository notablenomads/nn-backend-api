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
    nullable: true,
  })
  existingProjectChallenge?: ExistingProjectChallenge;

  @Column('text')
  projectDescription: string;

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

  @ManyToOne(() => User, (user) => user.leads)
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
