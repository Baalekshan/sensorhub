import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn } from 'typeorm';

@Entity()
export class DeviceHealth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  deviceId: string;

  @Column()
  @Index()
  timestamp: Date;

  @Column('float')
  memoryUsed: number;

  @Column('float')
  memoryTotal: number;

  @Column('float')
  cpuLoad: number;

  @Column('float')
  flashUsed: number;

  @Column('float')
  flashTotal: number;

  @Column({ nullable: true, type: 'float' })
  batteryLevel: number;

  @Column({ nullable: true, default: false })
  batteryCharging: boolean;

  @Column({ nullable: true, type: 'float' })
  batteryHoursRemaining: number;

  @Column({ nullable: true, type: 'float' })
  signalStrength: number;

  @Column({ nullable: true, type: 'float' })
  latency: number;

  @Column({ nullable: true, type: 'float' })
  packetLoss: number;

  @Column('bigint')
  uptime: number;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  freeHeap: number;

  @Column({ nullable: true })
  temperature: number;

  @Column({ nullable: true })
  restarts: number;

  @Column({ type: 'json', nullable: true })
  networkInfo: {
    type?: string;
    ssid?: string;
    rssi?: number;
    bssid?: string;
    ipAddress?: string;
    gatewayIp?: string;
    subnetMask?: string;
    dns?: string[];
  };

  @Column({ type: 'json', nullable: true })
  errors: {
    type: string;
    count: number;
    lastTimestamp: string;
    message: string;
  }[];

  @Column({ nullable: true })
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;
} 