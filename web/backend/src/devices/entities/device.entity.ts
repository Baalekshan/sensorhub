import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Sensor } from '../../sensors/entities/sensor.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  bluetoothAddress: string;

  @Column({ nullable: true })
  firmwareVersion: string;

  @Column({ default: 'Default' })
  activeProfile: string;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Sensor, sensor => sensor.device)
  sensors: Sensor[];
} 