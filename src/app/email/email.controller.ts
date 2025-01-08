import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { ContactFormDto } from './interfaces/contact-form.interface';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('contact')
  @ApiOperation({ summary: 'Submit contact form' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact form submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid form data',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to send email',
  })
  async submitContactForm(@Body() formData: ContactFormDto) {
    const success = await this.emailService.sendContactFormEmail(formData);

    if (!success) {
      throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      message: 'Contact form submitted successfully',
      success: true,
    };
  }
}
