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
    /* Reset styles for email clients */
    body, p {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    table {
      border-spacing: 0;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      display: block;
    }

    /* Base styles */
    .body-wrapper {
      background-color: #1a1a1a !important;
      margin: 0 auto !important;
      padding: 20px;
      width: 100%;
      max-width: 600px;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #ffffff !important;
    }
    
    .container {
      background-color: #2d2d2d !important;
      border-radius: 8px;
      overflow: hidden;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
    }
    
    .header {
      background-color: #2d2d2d !important;
      padding: 20px;
      text-align: center;
    }
    
    .logo {
      width: 150px;
      max-width: 150px;
      margin: 0 auto;
    }
    
    .content {
      background-color: #2d2d2d !important;
      padding: 30px;
      color: #ffffff !important;
    }
    
    .footer {
      background-color: #2d2d2d !important;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #888888 !important;
    }
    
    .social-links {
      padding: 20px 0;
    }
    
    .social-link {
      color: #F5910D !important;
      text-decoration: none;
      margin: 0 10px;
    }
    
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #F5910D !important;
      color: #1a1a1a !important;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 20px;
      font-weight: bold;
    }
    
    h1 {
      color: #F5910D !important;
      margin-bottom: 20px;
    }
    
    .info-block {
      margin: 15px 0;
      padding: 15px;
      background-color: #363636 !important;
      border-radius: 4px;
    }
    
    .info-label {
      font-weight: bold;
      color: #F5910D !important;
    }
    
    .message-block {
      margin: 20px 0;
      padding: 20px;
      background-color: #363636 !important;
      border-radius: 4px;
      border-left: 4px solid #F5910D;
      color: #ffffff !important;
    }
    
    blockquote {
      background-color: #363636 !important;
      border-left: 3px solid #F5910D;
      padding: 15px;
      margin: 20px 0;
      color: #ffffff !important;
      border-radius: 0 4px 4px 0;
    }
    
    .timestamp {
      color: #888888 !important;
      font-size: 12px;
      text-align: right;
      margin-top: 20px;
    }

    p {
      color: #ffffff !important;
    }
  `;

  private static readonly socialLinks = `
    <div class="social-links">
      <a href="https://twitter.com/notablenomads" class="social-link">Twitter</a> |
      <a href="https://linkedin.com/company/notablenomads" class="social-link">LinkedIn</a> |
      <a href="https://github.com/notablenomads" class="social-link">GitHub</a>
    </div>
  `;

  static generateTemplate(config: IEmailTemplateConfig, data: IEmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${data.subject}</title>
  <style type="text/css">${this.styles}</style>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; text-align: center;">
  <!--[if mso]>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr><td align="center">
  <![endif]-->
  <center>
    <div class="body-wrapper">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center" class="container">
        <tr>
          <td class="header" align="center">
            <img src="https://notablenomads.com/logo/new-nn-logo-dark.svg" alt="${config.companyName}" class="logo" style="width: 150px; max-width: 150px; margin: 0 auto; display: block;">
          </td>
        </tr>
        <tr>
          <td class="content" align="left" style="color: #ffffff !important;">
            ${data.content}
          </td>
        </tr>
        <tr>
          <td class="footer" align="center" style="color: #888888 !important;">
            ${data.showSocialLinks ? this.socialLinks : ''}
            <p style="margin: 10px 0; color: #ffffff !important;">${config.companyName}</p>
            ${config.companyAddress ? `<p style="margin: 10px 0; color: #ffffff !important;">${config.companyAddress}</p>` : ''}
            <p style="margin: 10px 0; color: #888888 !important;">This is an automated message, please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </div>
  </center>
  <!--[if mso]>
  </td></tr>
  </table>
  <![endif]-->
</body>
</html>`.trim();
  }
}
