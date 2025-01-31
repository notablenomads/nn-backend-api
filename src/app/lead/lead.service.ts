import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { Repository } from 'typeorm';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LeadDto } from './interfaces/lead.interface';
import { LeadResponseDto } from './interfaces/lead-response.dto';
import { Lead } from './entities/lead.entity';
import { LeadEmailTemplateHelper } from './helpers/lead-email-template.helper';
import { ERRORS } from '../core/errors/errors';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);
  private readonly sesClient: SESClient;
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
  ) {
    const region = this.configService.get<string>('aws.region');
    const accessKeyId = this.configService.get<string>('aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(ERRORS.GENERIC.MISSING_CONFIG({ configName: 'AWS credentials' }).message);
    }

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

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
      this.logger.error(ERRORS.EMAIL.TEMPLATE_ERROR({ reason: error.message }).message, error.stack);
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

  async findAll(): Promise<LeadResponseDto[]> {
    const leads = await this.leadRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
    return leads.map(this.mapToResponseDto);
  }

  async findOne(id: string): Promise<LeadResponseDto> {
    const lead = await this.leadRepository.findOneOrFail({
      where: { id },
    });
    return this.mapToResponseDto(lead);
  }

  private mapToResponseDto(lead: Lead): LeadResponseDto {
    const response = new LeadResponseDto();
    Object.assign(response, lead);
    return response;
  }

  private async sendAdminNotification(leadData: LeadDto): Promise<boolean> {
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
      this.logger.error(`Failed to send admin notification: ${error.message}`, error.stack);
      return false;
    }
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
          ...(leadData.projectType === 'EXISTING' ? [['Main Challenge', leadData.existingProjectChallenge]] : []),
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
          ['Type', this.formatProjectType(leadData.projectType)],
          ['Services', this.formatServices(leadData.services)],
          ['Timeline', this.formatTimeline(leadData.timeline)],
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
      <p>Thank you for your interest in working with Notable Nomads! We're excited to learn more about your project and help bring your vision to life.</p>
      <p>Here's a summary of what you shared with us:</p>
    `;

    sections.forEach((section) => {
      const sectionContent = section.content
        .map(([label, value]) => LeadEmailTemplateHelper.formatInfoLine(label, value))
        .join('\n');
      content += LeadEmailTemplateHelper.formatSection(section.title, sectionContent);
    });

    content += `
      <p>If you have any immediate questions, feel free to reply to this email.</p>
      <p>Best regards,<br>The Notable Nomads Team</p>
    `;

    return content;
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
}
