import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpStatus,
  HttpException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LeadService } from './lead.service';
import { LeadDto, ProjectType } from './interfaces/lead.interface';
import { LeadResponseDto } from './interfaces/lead-response.dto';
import { LeadOptionsDto } from './interfaces/lead-options.dto';

@ApiTags('Lead')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
      stopAtFirstError: false,
    }),
  )
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
    try {
      // Validate project type specific fields
      if (leadData.projectType === ProjectType.EXISTING && !leadData.existingProjectChallenge) {
        throw new HttpException(
          {
            message: 'Validation failed',
            errors: {
              existingProjectChallenge: ['Challenge must be specified for existing projects'],
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate competitor URLs if hasCompetitors is true
      if (leadData.hasCompetitors && (!leadData.competitorUrls || leadData.competitorUrls.length === 0)) {
        throw new HttpException(
          {
            message: 'Validation failed',
            errors: {
              competitorUrls: ['Competitor URLs must be provided when hasCompetitors is true'],
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const success = await this.leadService.submitLead(leadData);

      if (!success) {
        throw new HttpException(
          {
            message: 'Failed to process lead submission',
            errors: {
              general: ['An error occurred while processing your submission. Please try again later.'],
            },
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        message: 'Lead submitted successfully',
        success: true,
      };
    } catch (error) {
      // Handle validation errors from class-validator
      if (error?.response?.message === 'Validation failed' && error?.response?.errors) {
        throw new HttpException(
          {
            message: 'Validation failed',
            errors: error.response.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Handle other known errors
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unexpected errors
      throw new HttpException(
        {
          message: 'Internal server error',
          errors: {
            general: ['An unexpected error occurred. Please try again later.'],
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  @Get('options')
  @ApiOperation({ summary: 'Get all available options for the lead form' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Retrieved form options successfully',
    type: LeadOptionsDto,
  })
  getFormOptions(): LeadOptionsDto {
    return this.leadService.getFormOptions();
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
