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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LeadService } from './lead.service';
import { LeadValidationService } from './services/lead-validation.service';
import { LeadDto } from './dto/lead.dto';
import { LeadResponseDto } from './interfaces/lead-response.dto';
import { LeadOptionsDto } from './interfaces/lead-options.dto';
import { createLeadProcessingError, createLeadNotFoundError } from './constants/lead.errors';
import { Auth, AuthType } from '../core/decorators/auth.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { Role } from '../core/enums/role.enum';

@ApiTags('Lead')
@Controller('leads')
@Throttle({ default: { ttl: 60, limit: 20 } })
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadValidationService: LeadValidationService,
  ) {}

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
      // Validate lead data using the validation service
      this.leadValidationService.validateLeadData(leadData);

      // Submit lead
      const success = await this.leadService.submitLead(leadData);

      if (!success) {
        throw new HttpException(
          createLeadProcessingError('Failed to process lead submission'),
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        message: 'Lead submitted successfully',
        success: true,
      };
    } catch (error) {
      // Handle validation errors from class-validator and custom validation
      if (error?.response?.message === 'Validation failed' && error?.response?.errors) {
        throw error;
      }

      // Handle other known errors
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle unexpected errors
      throw new HttpException(
        createLeadProcessingError('An unexpected error occurred. Please try again later.'),
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
  @Auth(AuthType.JWT)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
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
  @Auth(AuthType.JWT)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  async getLeadById(@Param('id') id: string): Promise<LeadResponseDto> {
    try {
      return await this.leadService.findOne(id);
    } catch {
      throw new HttpException(createLeadNotFoundError(), HttpStatus.NOT_FOUND);
    }
  }
}
