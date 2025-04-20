import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { CreateDeviceInput } from './create-device.input';

@InputType()
export class UpdateDeviceInput extends PartialType(CreateDeviceInput) {
  @Field(() => ID)
  @IsNotEmpty()
  @IsUUID()
  id: string;
} 