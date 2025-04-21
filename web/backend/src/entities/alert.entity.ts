import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';
import { SensorReading } from './sensor-reading.entity';

@Entity()
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // 'ANOMALY', 'THRESHOLD', 'DEVICE_HEALTH', etc.

  @Column()
  severity: string; // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'

  @Column()
  @Index()
  deviceId: string;

  @Column({ nullable: true })
  sensorId: string;

  @Column({ nullable: true })
  readingId: string;

  @Column()
  message: string;

  @Column({ default: 'ACTIVE', enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED'] })
  status: string;

  @Column({ nullable: true })
  acknowledgedBy: string;

  @Column({ nullable: true })
  acknowledgedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  anomalyScore: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  organizationId: string;

  @Column()
  @Index()
  timestamp: Date;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @ManyToOne(() => SensorReading, { nullable: true })
  @JoinColumn({ name: 'readingId' })
  reading: SensorReading;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 