import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Sensor } from '../../sensors/entities/sensor.entity';
import { Field, ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';

export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OFFLINE = 'OFFLINE'
}

@ObjectType()
@Entity('devices')
export class Device {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  bluetoothAddress: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  firmwareVersion: string;

  @Field()
  @Column({ default: 'Default' })
  activeProfile: string;

  @Field()
  @Column({ default: false })
  isOnline: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  userId: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastSeen: Date;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [Sensor], { nullable: true })
  @OneToMany(() => Sensor, sensor => sensor.device)
  sensors: Sensor[];
  
  // This is a placeholder for the User relationship
  // Replace 'any' with the actual User entity type when available
  @ManyToOne(() => Object as any, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: any;
} 