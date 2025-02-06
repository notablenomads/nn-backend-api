import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { ContactFormDto } from './interfaces/contact-form.interface';
import { ERRORS } from '../core/errors/errors';

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
    description: ERRORS.GENERIC.VALIDATION_ERROR({ reason: 'Invalid form data' }).message,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: ERRORS.EMAIL.SENDING.FAILED({ reason: 'Internal server error' }).message,
  })
  async submitContactForm(@Body() formData: ContactFormDto) {
    const success = await this.emailService.sendContactFormEmail(formData);

    if (!success) {
      throw new HttpException(
        ERRORS.EMAIL.SENDING.FAILED({ reason: 'Failed to process email request' }).message,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      message: 'Contact form submitted successfully',
      success: true,
    };
  }
}
