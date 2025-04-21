import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { SensorConfig } from './sensor-config.entity';
import { CommunicationPreference } from './communication-preference.entity';
import { User } from './user.entity';

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column()
  macAddress: string;

  @Column({ default: '1.0.0' })
  firmwareVersion: string;

  @Column({ default: 'OFFLINE', enum: ['ONLINE', 'OFFLINE', 'UPDATING'] })
  status: string;

  @Column({ nullable: true })
  lastSeenAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  organizationId: string;

  @OneToMany(() => SensorConfig, sensorConfig => sensorConfig.device)
  sensorConfigs: SensorConfig[];

  @OneToOne(() => CommunicationPreference, { cascade: true })
  @JoinColumn()
  communicationPreferences: CommunicationPreference;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.devices)
  @JoinColumn({ name: 'userId' })
  user: User;
} 