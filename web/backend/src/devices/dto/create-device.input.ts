import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { DeviceStatus } from '../entities/device.entity';

@InputType()
export class CreateDeviceInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(DeviceStatus)
  status?: DeviceStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  macAddress?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ipAddress?: string;
} 