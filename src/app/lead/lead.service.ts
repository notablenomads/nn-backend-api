import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { LeadDto } from './interfaces/lead.interface';

@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async submitLead(leadData: LeadDto): Promise<boolean> {
    try {
      // Send notification emails
      const adminEmailSuccess = await this.sendAdminNotification(leadData);
      const userEmailSuccess = await this.sendUserConfirmation(leadData);

      return adminEmailSuccess && userEmailSuccess;
    } catch (error) {
      this.logger.error(`Failed to process lead submission: ${error.message}`, error.stack);
      return false;
    }
  }

  private async sendAdminNotification(leadData: LeadDto): Promise<boolean> {
    const emailData = {
      name: `${leadData.name}${leadData.company ? ` (${leadData.company})` : ''}`,
      email: leadData.email,
      message: this.formatAdminMessage(leadData),
    };

    return this.emailService.sendContactFormEmail(emailData);
  }

  private async sendUserConfirmation(leadData: LeadDto): Promise<boolean> {
    const emailData = {
      name: leadData.name,
      email: leadData.email,
      message: this.formatUserMessage(leadData),
    };

    return this.emailService.sendContactFormEmail(emailData);
  }

  private formatAdminMessage(leadData: LeadDto): string {
    return `
New Project Lead Submission

Services Required: ${leadData.services.join(', ')}
Project Type: ${leadData.projectType}
${leadData.projectType === 'EXISTING' ? `Main Challenge: ${leadData.existingProjectChallenge}\n` : ''}

Project Description:
${leadData.projectDescription}

Target Audience: ${leadData.targetAudience}
Industry: ${leadData.industry}

${leadData.hasCompetitors ? `Competitor/Inspiration URLs:\n${leadData.competitorUrls?.join('\n')}\n` : ''}

Design Preferences:
- Has Brand Guidelines: ${leadData.hasExistingBrand ? 'Yes' : 'No'}
- Preferred Style: ${leadData.designStyle}

Timeline: ${leadData.timeline}
Budget Range: ${leadData.budget}

Contact Preferences:
- Preferred Method: ${leadData.preferredContactMethod}
- Wants Consultation: ${leadData.wantsConsultation ? 'Yes' : 'No'}

${leadData.additionalNotes ? `Additional Notes:\n${leadData.additionalNotes}` : ''}
    `.trim();
  }

  private formatUserMessage(leadData: LeadDto): string {
    return `
Thank you for your interest in working with us! We've received your project inquiry and are excited to learn more about it.

Here's a summary of what you shared with us:

Project Overview:
- Type: ${this.formatProjectType(leadData.projectType)}
- Services: ${this.formatServices(leadData.services)}
- Timeline: ${this.formatTimeline(leadData.timeline)}

We'll review your submission and get back to you ${leadData.wantsConsultation ? 'to schedule your free consultation' : ''} within 1-2 business days via ${leadData.preferredContactMethod.toLowerCase()}.

If you have any immediate questions, feel free to reply to this email.

Best regards,
The Notable Nomads Team
    `.trim();
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
}
