import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IContactFormData } from './interfaces/contact-form.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESClient;
  private readonly fromEmail: string;
  private readonly toEmail: string;
  private readonly companyLogo: string = 'https://notablenomads.com/nn-logo-white.svg';
  private readonly companyName: string = 'Notable Nomads';
  private readonly companyAddress: string = 'Berlin, Germany';
  private readonly companyWebsite: string = 'https://notablenomads.com';

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
  }

  async sendContactFormEmail(data: IContactFormData): Promise<boolean> {
    try {
      // Send notification to admin
      const adminEmailSuccess = await this.sendAdminNotification(data);

      // Send confirmation to user
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
            Data: `Thank you for contacting ${this.companyName}`,
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
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #e1e1e1; margin: 0; padding: 0; background-color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; background-color: #2d2d2d; border-radius: 8px 8px 0 0; }
    .logo { width: 150px; height: auto; }
    .content { background-color: #2d2d2d; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; }
    .info-block { margin: 15px 0; padding: 15px; background-color: #363636; border-radius: 4px; }
    .info-label { font-weight: bold; color: #4dabf7; }
    .message-block { margin: 20px 0; padding: 20px; background-color: #363636; border-radius: 4px; border-left: 4px solid #4dabf7; }
    .timestamp { color: #888; font-size: 12px; text-align: right; margin-top: 20px; }
    h1 { color: #4dabf7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${this.companyLogo}" alt="${this.companyName}" class="logo">
    </div>
    <div class="content">
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
    </div>
    <div class="footer">
      <p>${this.companyName} - Admin Notification</p>
      <p>${this.companyAddress}</p>
    </div>
  </div>
</body>
</html>`.trim();
  }

  private createUserConfirmationHtml(data: IContactFormData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank you for contacting us</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #e1e1e1; margin: 0; padding: 0; background-color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; background-color: #2d2d2d; border-radius: 8px 8px 0 0; }
    .logo { width: 150px; height: auto; }
    .content { background-color: #2d2d2d; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; }
    .social-links { padding: 20px 0; }
    .social-links a { margin: 0 10px; color: #4dabf7; text-decoration: none; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4dabf7; color: #1a1a1a; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
    .button:hover { background-color: #3793dd; }
    h1 { color: #4dabf7; }
    blockquote { background-color: #363636; border-left: 3px solid #4dabf7; padding: 15px; margin: 20px 0; color: #e1e1e1; border-radius: 0 4px 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${this.companyLogo}" alt="${this.companyName}" class="logo">
    </div>
    <div class="content">
      <h1>Thank you for reaching out, ${data.name}!</h1>
      <p>We have received your message and appreciate you taking the time to contact us.</p>
      <p>Our team will review your message and get back to you as soon as possible.</p>
      <p>For your reference, here's what you sent us:</p>
      <blockquote>
        ${data.message}
      </blockquote>
      <a href="${this.companyWebsite}" class="button">Visit Our Website</a>
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="https://twitter.com/notablenomads">Twitter</a> |
        <a href="https://linkedin.com/company/notablenomads">LinkedIn</a> |
        <a href="https://github.com/notablenomads">GitHub</a>
      </div>
      <p>${this.companyName}</p>
      <p>${this.companyAddress}</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;
  }

  private createUserConfirmationText(data: IContactFormData): string {
    return `
Thank you for reaching out, ${data.name}!

We have received your message and appreciate you taking the time to contact us.
Our team will review your message and get back to you as soon as possible.

For your reference, here's what you sent us:

${data.message}

Visit our website: ${this.companyWebsite}

${this.companyName}
${this.companyAddress}

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
