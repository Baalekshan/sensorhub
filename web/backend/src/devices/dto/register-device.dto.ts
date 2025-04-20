import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SensorInfoDto {
  @ApiProperty({ description: 'Unique identifier for the sensor' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Type of sensor (e.g. BME280, HDC1080)' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Whether the sensor is calibrated', default: false })
  @IsOptional()
  @IsBoolean()
  isCalibrated?: boolean;

  @ApiProperty({ description: 'Whether the sensor is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProfileDto {
  @ApiProperty({ description: 'Profile identifier' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Profile name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Profile description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Device name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Bluetooth address or identifier' })
  @IsString()
  @IsNotEmpty()
  bluetoothAddress: string;

  @ApiProperty({ description: 'Firmware version', required: false })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @ApiProperty({ description: 'Sensors connected to the device', type: [SensorInfoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SensorInfoDto)
  sensors: SensorInfoDto[];

  @ApiProperty({ description: 'Applied profile configuration', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDto)
  profile?: ProfileDto;
} 