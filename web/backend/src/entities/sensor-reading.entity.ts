import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class SensorReading {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  deviceId: string;

  @Column()
  @Index()
  sensorId: string;

  @Column('float')
  value: number;

  @Column({ nullable: true })
  unit: string;

  @Column()
  @Index()
  timestamp: Date;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  quality: number;

  @Column({ default: false })
  isAnomaly: boolean;

  @Column({ nullable: true })
  anomalyScore: number;

  @Column({ nullable: true })
  anomalyReason: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;
} 