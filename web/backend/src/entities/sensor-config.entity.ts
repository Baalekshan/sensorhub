import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Device } from './device.entity';

@Entity()
export class SensorConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  protocolId: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'json' })
  busConfig: Record<string, any>;

  @Column({ type: 'json' })
  sensorConfig: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  calibrationConfig: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  readingOptions: Record<string, any>;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Device, device => device.sensorConfigs)
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column()
  deviceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 