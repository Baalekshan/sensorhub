import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { DeviceStatus } from '../entities/device.entity';

@InputType()
export class CreateDeviceInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  bluetoothAddress: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @Field({ nullable: true })
  @IsEnum(DeviceStatus)
  @IsOptional()
  status?: DeviceStatus;

  @Field({ nullable: true })
  @IsUUID()
  @IsOptional()
  userId?: string;
} 