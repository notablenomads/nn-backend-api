import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LeadService } from './lead.service';
import { LeadDto } from './interfaces/lead.interface';

@ApiTags('Lead')
@Controller('lead')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new project lead' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lead submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid lead data',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to process lead submission',
  })
  async submitLead(@Body() leadData: LeadDto) {
    const success = await this.leadService.submitLead(leadData);

    if (!success) {
      throw new HttpException('Failed to process lead submission', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      message: 'Lead submitted successfully',
      success: true,
    };
  }
}
