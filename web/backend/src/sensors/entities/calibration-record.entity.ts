import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { Sensor } from './sensor.entity';

@ObjectType()
@Entity('calibration_records')
export class CalibrationRecord {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Sensor)
  @ManyToOne(() => Sensor, (sensor) => sensor.calibrationRecords)
  @JoinColumn({ name: 'sensorId' })
  sensor: Sensor;

  @Field()
  @Column()
  sensorId: string;

  @Field(() => Object)
  @Column({ type: 'json' })
  calibrationData: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  performedBy?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;
} 