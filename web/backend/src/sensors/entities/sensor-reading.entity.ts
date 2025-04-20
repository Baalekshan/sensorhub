import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { Sensor } from './sensor.entity';

@ObjectType()
@Entity('sensor_readings')
export class SensorReading {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Sensor)
  @ManyToOne(() => Sensor, sensor => sensor.readings)
  @JoinColumn({ name: 'sensorId' })
  sensor: Sensor;

  @Field()
  @Column()
  sensorId: string;

  @Field(() => GraphQLISODateTime)
  @Column('float')
  value: number;

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;
} 