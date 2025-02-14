import { IsEnum, IsOptional, IsUUID, IsDateString, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LogLevel, LogActionType } from '../entities/log-entry.entity';

export class GetLogsDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  userId?: string;

  @IsOptional()
  @IsEnum(LogLevel)
  @ApiProperty({ required: false, enum: LogLevel })
  level?: LogLevel;

  @IsOptional()
  @IsEnum(LogActionType)
  @ApiProperty({ required: false, enum: LogActionType })
  actionType?: LogActionType;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  component?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  environment?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  requestId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  correlationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty({ required: false, type: Number, minimum: 1 })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty({ required: false, type: Number, minimum: 1 })
  limit?: number;
}
