import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Field, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';
import { Device } from '../../devices/entities/device.entity';
import { SensorReading } from './sensor-reading.entity';

@ObjectType()
@Entity('sensors')
export class Sensor {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  deviceId: string;

  @Field(() => Device)
  @ManyToOne(() => Device, device => device.sensors)
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Field()
  @Column()
  sensorType: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  displayName?: string;

  @Field()
  @Column({ default: false })
  isCalibrated: boolean;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Field(() => [SensorReading], { nullable: true })
  @OneToMany(() => SensorReading, reading => reading.sensor)
  readings: SensorReading[];
} 