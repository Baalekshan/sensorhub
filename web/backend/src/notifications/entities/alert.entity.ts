import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Sensor } from '../../sensors/entities/sensor.entity';

export enum AlertThresholdType {
  ABOVE = 'above',
  BELOW = 'below',
  EQUAL = 'equal',
  BETWEEN = 'between',
}

export enum AlertStatus {
  ACTIVE = 'active',
  TRIGGERED = 'triggered',
  RESOLVED = 'resolved',
  DISABLED = 'disabled',
}

@ObjectType()
@Entity('alerts')
export class Alert {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.alerts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Field()
  @Column()
  userId: string;

  @Field(() => Sensor)
  @ManyToOne(() => Sensor)
  @JoinColumn({ name: 'sensorId' })
  sensor: Sensor;

  @Field()
  @Column()
  sensorId: string;

  @Field()
  @Column({
    type: 'enum',
    enum: AlertThresholdType,
    default: AlertThresholdType.ABOVE,
  })
  thresholdType: AlertThresholdType;

  @Field()
  @Column({ type: 'decimal' })
  thresholdValue: number;

  @Field({ nullable: true })
  @Column({ type: 'decimal', nullable: true })
  thresholdSecondaryValue?: number;

  @Field()
  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  message?: string;

  @Field({ defaultValue: true })
  @Column({ default: true })
  sendEmail: boolean;

  @Field({ defaultValue: true })
  @Column({ default: true })
  sendPush: boolean;

  @Field({ defaultValue: false })
  @Column({ default: false })
  sendSms: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ nullable: true })
  lastTriggeredAt?: Date;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;
} 