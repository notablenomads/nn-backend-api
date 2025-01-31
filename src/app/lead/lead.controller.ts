import { Controller, Post, Get, Param, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LeadService } from './lead.service';
import { LeadDto } from './interfaces/lead.interface';
import { LeadResponseDto } from './interfaces/lead-response.dto';

@ApiTags('Lead')
@Controller('leads')
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

  @Get()
  @ApiOperation({ summary: 'Get all leads' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved all leads successfully',
    type: [LeadResponseDto],
  })
  async getAllLeads(): Promise<LeadResponseDto[]> {
    return this.leadService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by ID' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the lead',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved lead successfully',
    type: LeadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lead not found',
  })
  async getLeadById(@Param('id') id: string): Promise<LeadResponseDto> {
    try {
      return await this.leadService.findOne(id);
    } catch {
      throw new HttpException('Lead not found', HttpStatus.NOT_FOUND);
    }
  }
}
