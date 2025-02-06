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

export interface ILead {
  id: string;
  services: ServiceType[];
  projectType: ProjectType;
  existingProjectChallenge?: ExistingProjectChallenge;
  projectDescription: string;
  targetAudience: TargetAudience;
  industry: Industry;
  hasCompetitors: boolean;
  competitorUrls?: string[];
  hasExistingBrand: boolean;
  designStyle: DesignStyle;
  timeline: Timeline;
  budget: Budget;
  name: string;
  email: string;
  company?: string;
  preferredContactMethod: ContactMethod;
  wantsConsultation: boolean;
  additionalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
