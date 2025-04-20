import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { Sensor } from './sensor.entity';

@ObjectType()
class SafeRanges {
  @Field()
  min: number;

  @Field()
  max: number;

  @Field({ nullable: true })
  warningMin?: number;

  @Field({ nullable: true })
  warningMax?: number;
}

@ObjectType()
@Entity('sensor_types')
export class SensorType {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field()
  @Column()
  unit: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  icon?: string;

  @Field(() => SafeRanges, { nullable: true })
  @Column({ type: 'json', nullable: true })
  safeRanges?: SafeRanges;

  @Field(() => [String], { nullable: true })
  @Column('simple-array', { nullable: true })
  calibrationSteps?: string[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field()
  @Column({ default: false })
  calibrationRequired: boolean;

  @Field()
  @Column({ nullable: true })
  version?: string;

  @Field(() => [Sensor], { nullable: true })
  @OneToMany(() => Sensor, (sensor) => sensor.sensorType)
  sensors?: Sensor[];

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;
} 