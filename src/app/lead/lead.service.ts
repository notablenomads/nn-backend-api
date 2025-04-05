import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { Repository } from 'typeorm';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LeadDto } from './dto/lead.dto';
import { LeadResponseDto } from './interfaces/lead-response.dto';
import { Lead } from './entities/lead.entity';
import { LeadEmailTemplateHelper } from './helpers/lead-email-template.helper';
import { ERRORS } from '../core/errors/errors';
import { EnumOptionDto, LeadOptionsDto } from './interfaces/lead-options.dto';
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
} from './enums/lead.enum';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);
  private readonly fromEmail: string;
  private readonly toEmail: string;
  private readonly templateConfig: {
    companyLogo: string;
    companyName: string;
    companyWebsite: string;
  };

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly configService: ConfigService,
    private readonly sesClient: SESClient,
  ) {
    this.fromEmail = this.configService.get<string>('email.fromAddress') || 'no-reply@mail.notablenomads.com';
    this.toEmail = this.configService.get<string>('email.toAddress');

    if (!this.toEmail) {
      throw new Error(ERRORS.GENERIC.MISSING_CONFIG({ configName: 'EMAIL_TO_ADDRESS' }).message);
    }

    // Initialize template config
    this.templateConfig = {
      companyLogo: '', // Will be replaced with base64 encoded PNG
      companyName: 'Notable Nomads',
      companyWebsite: 'https://notablenomads.com',
    };

    // Load the logo from resources
    try {
      const logoPath = join(process.cwd(), 'dist', 'resources', 'logo', 'logo-dark.png');

      if (existsSync(logoPath)) {
        const logoBase64 = readFileSync(logoPath, 'base64');
        this.templateConfig.companyLogo = `data:image/png;base64,${logoBase64}`;
        this.logger.log('Successfully loaded logo from resources');
      } else {
        throw new Error(ERRORS.ENTITY.NOT_FOUND('Logo file', 'path', logoPath).message);
      }
    } catch (error) {
      this.logger.error(ERRORS.EMAIL.TEMPLATE.PARSE_ERROR({ reason: error.message }).message, error.stack);
      throw error;
    }
  }

  async submitLead(leadData: LeadDto): Promise<boolean> {
    try {
      // Create and save the lead
      const lead = this.leadRepository.create(leadData);
      await this.leadRepository.save(lead);

      // Send notification emails
      const [adminEmailSuccess, userEmailSuccess] = await Promise.all([
        this.sendAdminNotification(leadData),
        this.sendUserConfirmation(leadData),
      ]);

      return adminEmailSuccess && userEmailSuccess;
    } catch (error) {
      this.logger.error(`Failed to process lead submission: ${error.message}`, error.stack);
      return false;
    }
  }

  async create(leadDto: LeadDto): Promise<LeadResponseDto> {
    const lead = this.leadRepository.create(leadDto);
    const savedLead = await this.leadRepository.save(lead);
    return this.mapToResponseDto(savedLead);
  }

  async findAll(): Promise<LeadResponseDto[]> {
    const leads = await this.leadRepository.find();
    return leads.map(this.mapToResponseDto);
  }

  async findOne(id: string): Promise<LeadResponseDto> {
    const lead = await this.leadRepository.findOne({ where: { id } });
    if (!lead) {
      throw new Error('Lead not found');
    }
    return this.mapToResponseDto(lead);
  }

  private mapToResponseDto(lead: Lead): LeadResponseDto {
    const response = new LeadResponseDto();
    Object.assign(response, lead);
    return response;
  }

  private async sendAdminNotification(leadData: LeadDto, maxRetries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const content = this.formatAdminEmailContent(leadData);
        const command = new SendEmailCommand({
          Source: this.fromEmail,
          Destination: {
            ToAddresses: [this.toEmail],
          },
          Message: {
            Subject: {
              Data: `New Project Lead from ${leadData.name}${leadData.company ? ` (${leadData.company})` : ''}`,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: LeadEmailTemplateHelper.generateTemplate(this.templateConfig, {
                  subject: 'New Project Lead Submission',
                  content,
                  showSocialLinks: false,
                }),
                Charset: 'UTF-8',
              },
            },
          },
          ReplyToAddresses: [leadData.email],
        });

        const response = await this.sesClient.send(command);
        this.logger.log(`Admin notification sent successfully: ${response.MessageId}`);
        return true;
      } catch (error) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        this.logger.warn(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

        if (attempt === maxRetries) {
          this.logger.error(`Failed to send admin notification after ${maxRetries} attempts`, error.stack);
          return false;
        }

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
    return false;
  }

  private async sendUserConfirmation(leadData: LeadDto): Promise<boolean> {
    try {
      const content = this.formatUserEmailContent(leadData);
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [leadData.email],
        },
        Message: {
          Subject: {
            Data: 'Thank you for your project inquiry - Notable Nomads',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: LeadEmailTemplateHelper.generateTemplate(this.templateConfig, {
                subject: 'Project Inquiry Confirmation',
                content,
                showSocialLinks: true,
              }),
              Charset: 'UTF-8',
            },
          },
        },
      });

      const response = await this.sesClient.send(command);
      this.logger.log(`User confirmation sent successfully: ${response.MessageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send user confirmation: ${error.message}`, error.stack);
      return false;
    }
  }

  private formatAdminEmailContent(leadData: LeadDto): string {
    const sections = [
      {
        title: '🎯 Project Overview',
        content: [
          ['Type', this.formatProjectType(leadData.projectType)],
          ['Services', this.formatServices(leadData.services)],
          ['Description', leadData.projectDescription],
          ...(leadData.projectType === 'EXISTING' && leadData.existingProjectChallenges
            ? [['Main Challenges', this.formatExistingProjectChallenges(leadData.existingProjectChallenges)]]
            : []),
          ...(leadData.services.includes(ServiceType.MOBILE_APP) && leadData.mobileAppPlatform
            ? [['Mobile App Platform', this.formatMobileAppPlatform(leadData.mobileAppPlatform)]]
            : []),
          ...(leadData.services.includes(ServiceType.AI_ML) && leadData.aimlDatasetStatus
            ? [['AI/ML Dataset Status', this.formatAIMLDatasetStatus(leadData.aimlDatasetStatus)]]
            : []),
        ],
      },
      {
        title: '🎯 Market & Industry',
        content: [
          ['Target Audience', this.formatTargetAudience(leadData.targetAudience)],
          ['Industry', this.formatIndustry(leadData.industry)],
          ...(leadData.hasCompetitors && leadData.competitorUrls
            ? [['Competitor/Inspiration URLs', leadData.competitorUrls.join('\n')]]
            : []),
        ],
      },
      {
        title: '🎨 Design & Brand',
        content: [
          ['Has Brand Guidelines', leadData.hasExistingBrand ? 'Yes' : 'No'],
          ['Design Style', this.formatDesignStyle(leadData.designStyle)],
        ],
      },
      {
        title: '⏰ Timeline & Budget',
        content: [
          ['Timeline', this.formatTimeline(leadData.timeline)],
          ['Budget Range', this.formatBudget(leadData.budget)],
        ],
      },
      {
        title: '📞 Contact Information',
        content: [
          ['Name', leadData.name],
          ['Email', leadData.email],
          ...(leadData.company ? [['Company', leadData.company]] : []),
          ['Preferred Contact', this.formatContactMethod(leadData.preferredContactMethod)],
          ['Wants Consultation', leadData.wantsConsultation ? 'Yes' : 'No'],
        ],
      },
      {
        title: '💻 Technical Requirements',
        content: [
          [
            'Technical Expertise',
            leadData.technicalExpertise === TechnicalExpertise.TECHNICAL
              ? '👨‍💻 Technical User (Has development experience)'
              : '🤝 Non-Technical User (Needs technical guidance)',
          ],
          ...(leadData.technicalExpertise === TechnicalExpertise.TECHNICAL && leadData.technicalFeatures
            ? [['Required Features', '\n' + this.formatTechnicalFeatures(leadData.technicalFeatures)]]
            : []),
          ...(leadData.technicalExpertise === TechnicalExpertise.NON_TECHNICAL && leadData.projectDescription
            ? [['Project Vision', leadData.projectDescription]]
            : []),
        ],
      },
    ];

    let content = '<h1>🚀 New Project Lead Submission</h1>';

    sections.forEach((section) => {
      const sectionContent = section.content
        .map(([label, value]) => LeadEmailTemplateHelper.formatInfoLine(label, value))
        .join('\n');
      content += LeadEmailTemplateHelper.formatSection(section.title, sectionContent);
    });

    if (leadData.additionalNotes) {
      content += LeadEmailTemplateHelper.formatSection('📝 Additional Notes', leadData.additionalNotes);
    }

    return content;
  }

  private formatUserEmailContent(leadData: LeadDto): string {
    const sections = [
      {
        title: '🎯 Project Overview',
        content: [
          ['Project Type', this.formatProjectType(leadData.projectType)],
          ['Services', this.formatServices(leadData.services)],
          ...(leadData.services.includes(ServiceType.MOBILE_APP) && leadData.mobileAppPlatform
            ? [['Mobile Platform', this.formatMobileAppPlatform(leadData.mobileAppPlatform)]]
            : []),
          ['Industry', this.formatIndustry(leadData.industry)],
          ['Timeline', this.formatTimeline(leadData.timeline)],
        ],
      },
      {
        title: '💻 Technical Details',
        content: [
          [
            'Technical Level',
            leadData.technicalExpertise === TechnicalExpertise.TECHNICAL
              ? 'Technical User (Development Experience)'
              : 'Non-Technical User',
          ],
          ...(leadData.technicalExpertise === TechnicalExpertise.TECHNICAL && leadData.technicalFeatures
            ? [['Required Features', this.formatTechnicalFeaturesSimple(leadData.technicalFeatures)]]
            : []),
        ],
      },
      {
        title: '📅 Next Steps',
        content: [
          [
            'Contact Method',
            `We'll reach out via ${this.formatContactMethod(
              leadData.preferredContactMethod,
            ).toLowerCase()} within 1-2 business days`,
          ],
          [
            'Consultation',
            leadData.wantsConsultation
              ? 'We will schedule your free consultation'
              : 'We will discuss your project details',
          ],
        ],
      },
    ];

    let content = `
      <h1>Thank You for Your Project Inquiry!</h1>
      <p>Dear ${leadData.name},</p>
      <p>Thank you for choosing Notable Nomads! We're excited to learn more about your project and help bring your vision to life.</p>
      <p>Here's a summary of your project requirements:</p>
    `;

    sections.forEach((section) => {
      const sectionContent = section.content
        .map(([label, value]) => LeadEmailTemplateHelper.formatInfoLine(label, value))
        .join('\n');
      content += LeadEmailTemplateHelper.formatSection(section.title, sectionContent);
    });

    content += `
      <p>If you have any questions before we contact you, feel free to reply to this email.</p>
      <p>Best regards,<br>The Notable Nomads Team</p>
    `;

    return content;
  }

  private formatTechnicalFeaturesSimple(features: TechnicalFeature[]): string {
    return features
      .map((feature) => this.getFeatureLabel(feature))
      .sort()
      .join(', ');
  }

  private formatTechnicalFeatures(features: TechnicalFeature[]): string {
    return features
      .map((feature) => this.getFeatureLabel(feature))
      .sort()
      .join(', ');
  }

  private formatProjectType(type: string): string {
    return type === 'NEW' ? 'New Project' : 'Existing Project Enhancement';
  }

  private formatServices(services: string[]): string {
    return services
      .map((service) => {
        switch (service) {
          case 'WEB_APP':
            return 'Web Application';
          case 'MOBILE_APP':
            return 'Mobile Application';
          case 'AI_ML':
            return 'AI/ML Development';
          case 'DEVOPS':
            return 'DevOps & Infrastructure';
          case 'ARCHITECTURE':
            return 'System Architecture';
          default:
            return service;
        }
      })
      .join(', ');
  }

  private formatTimeline(timeline: string): string {
    switch (timeline) {
      case 'LESS_THAN_3_MONTHS':
        return 'Less than 3 months';
      case 'THREE_TO_SIX_MONTHS':
        return '3-6 months';
      case 'MORE_THAN_6_MONTHS':
        return 'More than 6 months';
      case 'FLEXIBLE':
        return 'Flexible';
      default:
        return timeline;
    }
  }

  private formatTargetAudience(audience: string): string {
    switch (audience) {
      case 'CONSUMERS':
        return 'Consumers (B2C)';
      case 'BUSINESSES':
        return 'Businesses (B2B)';
      case 'BOTH':
        return 'Both B2B and B2C';
      default:
        return audience;
    }
  }

  private formatIndustry(industry: string): string {
    switch (industry) {
      case 'ECOMMERCE':
        return 'E-commerce';
      case 'HEALTHCARE':
        return 'Healthcare';
      case 'EDUCATION':
        return 'Education';
      case 'SAAS':
        return 'SaaS';
      case 'FINANCE':
        return 'Finance';
      case 'ENTERTAINMENT':
        return 'Entertainment';
      default:
        return industry;
    }
  }

  private formatDesignStyle(style: string): string {
    switch (style) {
      case 'MODERN':
        return 'Modern & Minimalist';
      case 'BOLD':
        return 'Bold & Playful';
      case 'PROFESSIONAL':
        return 'Professional & Corporate';
      case 'UNDECIDED':
        return 'To be discussed';
      default:
        return style;
    }
  }

  private formatBudget(budget: string): string {
    switch (budget) {
      case 'LESS_THAN_10K':
        return 'Less than $10,000';
      case 'TEN_TO_FIFTY_K':
        return '$10,000 - $50,000';
      case 'FIFTY_TO_HUNDRED_K':
        return '$50,000 - $100,000';
      case 'MORE_THAN_100K':
        return 'More than $100,000';
      case 'NOT_SURE':
        return 'To be discussed';
      default:
        return budget;
    }
  }

  private formatContactMethod(method: string): string {
    switch (method) {
      case 'EMAIL':
        return 'Email';
      case 'PHONE':
        return 'Phone';
      case 'WHATSAPP':
        return 'WhatsApp';
      default:
        return method;
    }
  }

  private formatExistingProjectChallenges(challenges: ExistingProjectChallenge[]): string {
    const challengeMap = {
      [ExistingProjectChallenge.PERFORMANCE]: 'Performance Issues',
      [ExistingProjectChallenge.SCALABILITY]: 'Scalability Challenges',
      [ExistingProjectChallenge.BUGS]: 'Bug Fixes Needed',
      [ExistingProjectChallenge.UX]: 'User Experience Issues',
      [ExistingProjectChallenge.SECURITY]: 'Security Concerns',
      [ExistingProjectChallenge.MAINTENANCE]: 'Maintenance Difficulties',
      [ExistingProjectChallenge.TECHNICAL_DEBT]: 'Technical Debt',
      [ExistingProjectChallenge.OUTDATED]: 'Outdated Technology',
      [ExistingProjectChallenge.OTHER]: 'Other Challenges',
    };
    return challenges.map((challenge) => challengeMap[challenge] || challenge).join(', ');
  }

  private formatMobileAppPlatform(platform: MobileAppPlatform): string {
    const platformMap = {
      [MobileAppPlatform.IOS]: 'iOS',
      [MobileAppPlatform.ANDROID]: 'Android',
      [MobileAppPlatform.BOTH]: 'iOS & Android',
    };
    return platformMap[platform] || platform;
  }

  private formatAIMLDatasetStatus(status: AIMLDatasetStatus): string {
    const statusMap = {
      [AIMLDatasetStatus.YES]: 'Has Datasets/Models',
      [AIMLDatasetStatus.NO]: 'No Datasets/Models',
      [AIMLDatasetStatus.NOT_SURE]: 'Needs Dataset Consultation',
    };
    return statusMap[status] || status;
  }

  private getFeatureLabel(feature: TechnicalFeature): string {
    const labels = {
      [TechnicalFeature.AUTHENTICATION]: 'Authentication System',
      [TechnicalFeature.USER_MANAGEMENT]: 'User Management',
      [TechnicalFeature.SOCIAL_LOGIN]: 'Social Login',
      [TechnicalFeature.FILE_HANDLING]: 'File System',
      [TechnicalFeature.SEARCH_FILTER]: 'Search & Filter',
      [TechnicalFeature.NOTIFICATIONS]: 'Notification System',
      [TechnicalFeature.ADMIN_PANEL]: 'Admin Dashboard',
      [TechnicalFeature.PAYMENTS]: 'Payment Processing',
      [TechnicalFeature.ANALYTICS]: 'Business Analytics',
      [TechnicalFeature.MESSAGING]: 'Communication',
      [TechnicalFeature.CALENDAR]: 'Calendar System',
      [TechnicalFeature.SEO_OPTIMIZATION]: 'SEO Features',
      [TechnicalFeature.SOCIAL_SHARING]: 'Social Integration',
      [TechnicalFeature.REFERRAL_SYSTEM]: 'Referral System',
      [TechnicalFeature.MARKETING_TOOLS]: 'Marketing Tools',
      [TechnicalFeature.SHOPPING_CART]: 'Shopping Cart',
      [TechnicalFeature.INVENTORY]: 'Inventory System',
      [TechnicalFeature.ORDER_MANAGEMENT]: 'Order Management',
      [TechnicalFeature.PRODUCT_MANAGEMENT]: 'Product Management',
      [TechnicalFeature.API_INTEGRATION]: 'API Integration',
      [TechnicalFeature.MOBILE_SYNC]: 'Mobile Integration',
      [TechnicalFeature.ANALYTICS_TRACKING]: 'Analytics Tracking',
      [TechnicalFeature.OFFLINE_MODE]: 'Offline Support',
    };
    return labels[feature] || feature;
  }

  getFormOptions(): LeadOptionsDto {
    return {
      services: this.getServiceOptions(),
      projectTypes: this.getProjectTypeOptions(),
      existingProjectChallenges: this.getExistingProjectChallengeOptions(),
      targetAudiences: this.getTargetAudienceOptions(),
      industries: this.getIndustryOptions(),
      designStyles: this.getDesignStyleOptions(),
      timelines: this.getTimelineOptions(),
      budgets: this.getBudgetOptions(),
      contactMethods: this.getContactMethodOptions(),
      technicalExpertise: this.getTechnicalExpertiseOptions(),
      technicalFeatures: this.getTechnicalFeatureOptions(),
    };
  }

  private getServiceOptions(): EnumOptionDto[] {
    return [
      {
        value: ServiceType.WEB_APP,
        label: 'Web Application',
        description: 'Full-stack web applications and platforms',
      },
      {
        value: ServiceType.MOBILE_APP,
        label: 'Mobile Application',
        description: 'Native and cross-platform mobile apps',
      },
      {
        value: ServiceType.AI_ML,
        label: 'AI/ML Development',
        description: 'Artificial Intelligence and Machine Learning solutions',
      },
      {
        value: ServiceType.DEVOPS,
        label: 'DevOps & Infrastructure',
        description: 'Cloud infrastructure and deployment automation',
      },
      {
        value: ServiceType.ARCHITECTURE,
        label: 'System Architecture',
        description: 'Technical architecture and system design',
      },
      { value: ServiceType.OTHER, label: 'Other', description: 'Custom development needs' },
    ];
  }

  private getProjectTypeOptions(): EnumOptionDto[] {
    return [
      { value: ProjectType.NEW, label: 'New Project', description: 'Starting a new project from scratch' },
      {
        value: ProjectType.EXISTING,
        label: 'Existing Project',
        description: 'Enhancing or fixing an existing project',
      },
    ];
  }

  private getExistingProjectChallengeOptions(): EnumOptionDto[] {
    return [
      {
        value: ExistingProjectChallenge.PERFORMANCE,
        label: 'Performance Issues',
        description: 'Slow loading times or resource usage problems',
      },
      {
        value: ExistingProjectChallenge.SCALABILITY,
        label: 'Scalability Challenges',
        description: 'Difficulty handling growth or increased load',
      },
      { value: ExistingProjectChallenge.BUGS, label: 'Bug Fixes', description: 'Existing bugs or technical issues' },
      { value: ExistingProjectChallenge.UX, label: 'User Experience', description: 'Usability or interface problems' },
      { value: ExistingProjectChallenge.OTHER, label: 'Other', description: 'Other technical challenges' },
    ];
  }

  private getTargetAudienceOptions(): EnumOptionDto[] {
    return [
      {
        value: TargetAudience.CONSUMERS,
        label: 'Consumers (B2C)',
        description: 'Direct to consumer products/services',
      },
      { value: TargetAudience.BUSINESSES, label: 'Businesses (B2B)', description: 'Business to business solutions' },
      { value: TargetAudience.BOTH, label: 'Both B2B and B2C', description: 'Mixed audience products/services' },
    ];
  }

  private getIndustryOptions(): EnumOptionDto[] {
    return [
      { value: Industry.ECOMMERCE, label: 'E-commerce', description: 'Online retail and shopping platforms' },
      { value: Industry.HEALTHCARE, label: 'Healthcare', description: 'Medical and healthcare solutions' },
      { value: Industry.EDUCATION, label: 'Education', description: 'Educational technology and learning platforms' },
      { value: Industry.SAAS, label: 'SaaS', description: 'Software as a Service products' },
      { value: Industry.FINANCE, label: 'Finance', description: 'Financial technology and services' },
      { value: Industry.ENTERTAINMENT, label: 'Entertainment', description: 'Media and entertainment platforms' },
      { value: Industry.OTHER, label: 'Other', description: 'Other industry sectors' },
    ];
  }

  private getDesignStyleOptions(): EnumOptionDto[] {
    return [
      {
        value: DesignStyle.MODERN,
        label: 'Modern & Minimalist',
        description: 'Clean, simple, and contemporary design',
      },
      { value: DesignStyle.BOLD, label: 'Bold & Playful', description: 'Vibrant, energetic, and creative design' },
      {
        value: DesignStyle.PROFESSIONAL,
        label: 'Professional & Corporate',
        description: 'Traditional business-oriented design',
      },
      { value: DesignStyle.UNDECIDED, label: 'To be discussed', description: 'Open to design recommendations' },
    ];
  }

  private getTimelineOptions(): EnumOptionDto[] {
    return [
      { value: Timeline.LESS_THAN_3_MONTHS, label: 'Less than 3 months', description: 'Quick turnaround projects' },
      { value: Timeline.THREE_TO_SIX_MONTHS, label: '3-6 months', description: 'Medium-term projects' },
      { value: Timeline.MORE_THAN_6_MONTHS, label: 'More than 6 months', description: 'Long-term projects' },
      { value: Timeline.FLEXIBLE, label: 'Flexible', description: 'Open to timeline discussion' },
    ];
  }

  private getBudgetOptions(): EnumOptionDto[] {
    return [
      { value: Budget.LESS_THAN_10K, label: 'Less than $10,000', description: 'Small-scale projects' },
      { value: Budget.TEN_TO_FIFTY_K, label: '$10,000 - $50,000', description: 'Medium-scale projects' },
      { value: Budget.FIFTY_TO_HUNDRED_K, label: '$50,000 - $100,000', description: 'Large-scale projects' },
      { value: Budget.MORE_THAN_100K, label: 'More than $100,000', description: 'Enterprise-level projects' },
      { value: Budget.NOT_SURE, label: 'To be discussed', description: 'Open to budget discussion' },
    ];
  }

  private getContactMethodOptions(): EnumOptionDto[] {
    return [
      { value: ContactMethod.EMAIL, label: 'Email', description: 'Communicate via email' },
      { value: ContactMethod.PHONE, label: 'Phone', description: 'Communicate via phone call' },
      { value: ContactMethod.WHATSAPP, label: 'WhatsApp', description: 'Communicate via WhatsApp' },
    ];
  }

  private getTechnicalExpertiseOptions(): EnumOptionDto[] {
    return [
      {
        value: TechnicalExpertise.TECHNICAL,
        label: 'Technical User',
        description: 'I have development experience',
      },
      {
        value: TechnicalExpertise.NON_TECHNICAL,
        label: 'Non-Technical',
        description: 'I need guidance on technical decisions',
      },
    ];
  }

  private getTechnicalFeatureOptions(): EnumOptionDto[] {
    return [
      // User & Security
      {
        value: TechnicalFeature.AUTHENTICATION,
        label: 'Authentication & Security',
        description: 'User registration, login, and account security',
      },
      {
        value: TechnicalFeature.USER_MANAGEMENT,
        label: 'User Management',
        description: 'User roles, profiles, and access control',
      },
      {
        value: TechnicalFeature.SOCIAL_LOGIN,
        label: 'Social Login',
        description: 'Sign in with Google, Facebook, or other platforms',
      },

      // Core Features
      {
        value: TechnicalFeature.FILE_HANDLING,
        label: 'File System',
        description: 'Upload and manage files, images, and documents',
      },
      {
        value: TechnicalFeature.SEARCH_FILTER,
        label: 'Search & Filter',
        description: 'Advanced search, filtering, and sorting functionality',
      },
      {
        value: TechnicalFeature.NOTIFICATIONS,
        label: 'Notification System',
        description: 'Email, push, and in-app notifications',
      },

      // Business Features
      {
        value: TechnicalFeature.PAYMENTS,
        label: 'Payment Processing',
        description: 'Payment gateway and subscription management',
      },
      {
        value: TechnicalFeature.ANALYTICS,
        label: 'Business Analytics',
        description: 'Business metrics and reporting dashboard',
      },
      {
        value: TechnicalFeature.MESSAGING,
        label: 'Communication',
        description: 'Chat, messaging, and user communication',
      },

      // Growth Features
      {
        value: TechnicalFeature.SEO_OPTIMIZATION,
        label: 'SEO Features',
        description: 'Search engine optimization capabilities',
      },
      {
        value: TechnicalFeature.SOCIAL_SHARING,
        label: 'Social Integration',
        description: 'Social media sharing and integration',
      },
      {
        value: TechnicalFeature.REFERRAL_SYSTEM,
        label: 'Referral System',
        description: 'User referral and reward program',
      },

      // E-commerce
      {
        value: TechnicalFeature.SHOPPING_CART,
        label: 'Shopping Cart',
        description: 'Shopping cart and checkout process',
      },
      {
        value: TechnicalFeature.INVENTORY,
        label: 'Inventory System',
        description: 'Product and inventory management',
      },
      {
        value: TechnicalFeature.ORDER_MANAGEMENT,
        label: 'Order Management',
        description: 'Order processing and tracking system',
      },

      // Integration
      {
        value: TechnicalFeature.API_INTEGRATION,
        label: 'API Integration',
        description: 'Connect with third-party services',
      },
      {
        value: TechnicalFeature.MOBILE_SYNC,
        label: 'Mobile Integration',
        description: 'Mobile app data synchronization',
      },
      {
        value: TechnicalFeature.ANALYTICS_TRACKING,
        label: 'Analytics Tracking',
        description: 'Integration with analytics platforms',
      },

      {
        value: TechnicalFeature.ADMIN_PANEL,
        label: 'Admin Dashboard',
        description: 'Complete administrative control panel',
      },
      {
        value: TechnicalFeature.CALENDAR,
        label: 'Calendar System',
        description: 'Scheduling, bookings, and calendar management',
      },
      {
        value: TechnicalFeature.MARKETING_TOOLS,
        label: 'Marketing Tools',
        description: 'Email campaigns, automation, and marketing features',
      },
      {
        value: TechnicalFeature.PRODUCT_MANAGEMENT,
        label: 'Product Management',
        description: 'Product catalog, variants, and categories',
      },
      {
        value: TechnicalFeature.OFFLINE_MODE,
        label: 'Offline Support',
        description: 'Work offline and sync when connected',
      },
    ];
  }

  async validateLeadData(leadDto: LeadDto) {
    // Phone validation for specific contact methods
    if (
      (leadDto.preferredContactMethod === ContactMethod.PHONE ||
        leadDto.preferredContactMethod === ContactMethod.WHATSAPP) &&
      !leadDto.phone
    ) {
      throw new BadRequestException('Phone number is required when contact method is Phone or WhatsApp');
    }

    // Validate phone format if provided
    if (leadDto.phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(leadDto.phone)) {
        throw new BadRequestException(
          'Invalid phone number format. Please use international format (e.g., +1234567890)',
        );
      }
    }

    // Project type specific validation
    if (
      leadDto.projectType === ProjectType.EXISTING &&
      (!leadDto.existingProjectChallenges || leadDto.existingProjectChallenges.length === 0)
    ) {
      throw new BadRequestException('Please specify at least one challenge for your existing project');
    }

    // Service specific validations
    if (leadDto.services.includes(ServiceType.MOBILE_APP) && !leadDto.mobileAppPlatform) {
      throw new BadRequestException('Please select a target platform for your mobile app');
    }

    if (leadDto.services.includes(ServiceType.AI_ML) && !leadDto.aimlDatasetStatus) {
      throw new BadRequestException('Please indicate if you have datasets/models for your AI/ML project');
    }

    // Competitor validation
    if (leadDto.hasCompetitors && (!leadDto.competitorUrls || leadDto.competitorUrls.length === 0)) {
      throw new BadRequestException('Please provide at least one competitor when hasCompetitors is true');
    }

    // Technical expertise validation
    if (leadDto.technicalExpertise === TechnicalExpertise.TECHNICAL) {
      if (!leadDto.technicalFeatures || leadDto.technicalFeatures.length === 0) {
        throw new BadRequestException('Please select at least one technical feature');
      }
    } else if (leadDto.technicalExpertise === TechnicalExpertise.NON_TECHNICAL) {
      if (!leadDto.projectDescription || leadDto.projectDescription.trim().length < 10) {
        throw new BadRequestException('Please provide a more detailed project description (minimum 10 characters)');
      }
    }
  }
}
