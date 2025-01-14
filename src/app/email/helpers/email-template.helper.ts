interface IEmailTemplateConfig {
  companyLogo: string;
  companyName: string;
  companyAddress?: string;
  companyWebsite: string;
}

interface IEmailTemplateData {
  subject: string;
  content: string;
  showSocialLinks?: boolean;
}

export class EmailTemplateHelper {
  private static readonly styles = `
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #e1e1e1; margin: 0; padding: 0; background-color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; background-color: #2d2d2d; border-radius: 8px 8px 0 0; }
    .logo { width: 150px; height: auto; }
    .content { background-color: #2d2d2d; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #888; }
    .social-links { padding: 20px 0; }
    .social-links a { margin: 0 10px; color: #F5910D; text-decoration: none; }
    .button { display: inline-block; padding: 12px 24px; background-color: #F5910D; color: #1a1a1a; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
    .button:hover { background-color: #d67d0b; }
    h1 { color: #F5910D; }
    .info-block { margin: 15px 0; padding: 15px; background-color: #363636; border-radius: 4px; }
    .info-label { font-weight: bold; color: #F5910D; }
    .message-block { margin: 20px 0; padding: 20px; background-color: #363636; border-radius: 4px; border-left: 4px solid #F5910D; }
    blockquote { background-color: #363636; border-left: 3px solid #F5910D; padding: 15px; margin: 20px 0; color: #e1e1e1; border-radius: 0 4px 4px 0; }
    .timestamp { color: #888; font-size: 12px; text-align: right; margin-top: 20px; }
  `;

  private static readonly socialLinks = `
    <div class="social-links">
      <a href="https://twitter.com/notablenomads">Twitter</a> |
      <a href="https://linkedin.com/company/notablenomads">LinkedIn</a> |
      <a href="https://github.com/notablenomads">GitHub</a>
    </div>
  `;

  static generateTemplate(config: IEmailTemplateConfig, data: IEmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <style>${this.styles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${config.companyLogo}" alt="${config.companyName}" class="logo">
    </div>
    <div class="content">
      ${data.content}
    </div>
    <div class="footer">
      ${data.showSocialLinks ? this.socialLinks : ''}
      <p>${config.companyName}</p>
      ${config.companyAddress ? `<p>${config.companyAddress}</p>` : ''}
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`.trim();
  }
}
