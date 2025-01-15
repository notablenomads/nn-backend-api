import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IContactFormData } from './interfaces/contact-form.interface';
import { EmailTemplateHelper } from './helpers/email-template.helper';

interface ITemplateConfig {
  companyLogo: string;
  companyName: string;
  companyAddress?: string;
  companyWebsite: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;
  private readonly toEmail: string;
  private readonly templateConfig: ITemplateConfig;

  constructor(private readonly configService: ConfigService) {
    this.sesClient = new SESClient({
      region: this.configService.get<string>('aws.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId'),
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey'),
      },
    });

    this.fromEmail = this.configService.get<string>('email.fromAddress') || 'no-reply@mail.notablenomads.com';
    this.toEmail = this.configService.get<string>('email.toAddress');

    // Initialize template config with fallback logo
    this.templateConfig = {
      companyLogo: 'https://notablenomads.com/logo/logo-dark.svg', // Default fallback
      companyName: 'Notable Nomads',
      companyWebsite: 'https://notablenomads.com',
    };

    // Try to load the logo from resources
    try {
      const logoPath = join(process.cwd(), 'dist', 'resources', 'logo', 'logo-dark.svg');

      if (existsSync(logoPath)) {
        const logoBase64 = readFileSync(logoPath, 'base64');
        this.templateConfig.companyLogo = `data:image/svg+xml;base64,${logoBase64}`;
        this.logger.log('Successfully loaded logo from resources');
      } else {
        this.logger.warn(`Logo file not found at ${logoPath}, using fallback URL`);
      }
    } catch (error) {
      this.logger.warn(`Failed to read logo file: ${error.message}. Using fallback URL.`);
    }
  }

  async sendContactFormEmail(data: IContactFormData): Promise<boolean> {
    try {
      const adminEmailSuccess = await this.sendAdminNotification(data);
      const userEmailSuccess = await this.sendUserConfirmation(data);
      return adminEmailSuccess && userEmailSuccess;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  private async sendAdminNotification(data: IContactFormData): Promise<boolean> {
    try {
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [this.toEmail],
        },
        Message: {
          Subject: {
            Data: `Contact Form Submission from ${data.name}`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: this.createAdminEmailBody(data),
              Charset: 'UTF-8',
            },
            Text: {
              Data: this.createAdminEmailText(data),
              Charset: 'UTF-8',
            },
          },
        },
        ReplyToAddresses: [data.email],
      });

      const response = await this.sesClient.send(command);
      this.logger.log(`Admin notification sent successfully: ${response.MessageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send admin notification: ${error.message}`, error.stack);
      return false;
    }
  }

  private async sendUserConfirmation(data: IContactFormData): Promise<boolean> {
    try {
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [data.email],
        },
        Message: {
          Subject: {
            Data: `Thank you for contacting ${this.templateConfig.companyName}`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: this.createUserConfirmationHtml(data),
              Charset: 'UTF-8',
            },
            Text: {
              Data: this.createUserConfirmationText(data),
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

  private createAdminEmailBody(data: IContactFormData): string {
    const content = `
      <h1>New Contact Form Submission</h1>
      <div class="info-block">
        <p><span class="info-label">Name:</span> ${data.name}</p>
        <p><span class="info-label">Email:</span> ${data.email}</p>
      </div>
      <div class="message-block">
        <p class="info-label">Message:</p>
        <p>${data.message}</p>
      </div>
      <div class="timestamp">
        Submitted at: ${new Date().toISOString()}
      </div>
    `;

    return EmailTemplateHelper.generateTemplate(this.templateConfig, {
      subject: 'New Contact Form Submission',
      content,
      showSocialLinks: false,
    });
  }

  private createUserConfirmationHtml(data: IContactFormData): string {
    const content = `
      <h1>Thank you for reaching out, ${data.name}!</h1>
      <p>We have received your message and appreciate you taking the time to contact us.</p>
      <p>Our team will review your message and get back to you as soon as possible.</p>
      <p>For your reference, here's what you sent us:</p>
      <blockquote>
        ${data.message}
      </blockquote>
      <a href="${this.templateConfig.companyWebsite}" class="button">Visit Our Website</a>
    `;

    return EmailTemplateHelper.generateTemplate(this.templateConfig, {
      subject: 'Thank You for Contacting Us',
      content,
      showSocialLinks: true,
    });
  }

  private createUserConfirmationText(data: IContactFormData): string {
    return `
Thank you for reaching out, ${data.name}!

We have received your message and appreciate you taking the time to contact us.
Our team will review your message and get back to you as soon as possible.

For your reference, here's what you sent us:

${data.message}

Visit our website: ${this.templateConfig.companyWebsite}

${this.templateConfig.companyName}
${this.templateConfig.companyAddress ? this.templateConfig.companyAddress + '\n' : ''}
This is an automated message, please do not reply to this email.
    `.trim();
  }

  private createAdminEmailText(data: IContactFormData): string {
    return `
New Contact Form Submission

Name: ${data.name}
Email: ${data.email}

Message:
${data.message}

Sent at: ${new Date().toISOString()}
    `.trim();
  }
}
