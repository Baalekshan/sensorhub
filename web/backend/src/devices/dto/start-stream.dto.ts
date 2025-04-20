import { IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartStreamDto {
  @ApiProperty({ description: 'Sampling interval in milliseconds', required: false, default: 1000 })
  @IsOptional()
  @IsNumber()
  samplingInterval?: number;
} 