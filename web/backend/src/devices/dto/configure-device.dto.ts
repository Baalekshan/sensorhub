import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SensorConfigDto {
  @ApiProperty({ description: 'Sensor identifier' })
  @IsString()
  @IsNotEmpty()
  sensorId: string;

  @ApiProperty({ description: 'Whether the sensor is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Whether the sensor is calibrated', default: false })
  @IsOptional()
  @IsBoolean()
  isCalibrated?: boolean;

  @ApiProperty({ description: 'Calibration data for the sensor', required: false })
  @IsOptional()
  @IsObject()
  calibrationData?: Record<string, any>;
}

export class ConfigureDeviceDto {
  @ApiProperty({ description: 'Device name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Active profile name', required: false })
  @IsOptional()
  @IsString()
  activeProfile?: string;

  @ApiProperty({ description: 'Sensor configurations', type: [SensorConfigDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SensorConfigDto)
  sensors?: SensorConfigDto[];
} 