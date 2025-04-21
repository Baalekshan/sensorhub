import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class CommunicationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json', default: '[]' })
  preferredChannels: string[];

  @Column({ type: 'json', nullable: true })
  mqttConfig: {
    brokerUrl?: string;
    username?: string;
    password?: string;
    clientId?: string;
    useTls?: boolean;
  };

  @Column({ type: 'json', nullable: true })
  bleConfig: {
    advertisingName?: string;
    securityLevel?: string;
    autoReconnect?: boolean;
  };

  @Column({ type: 'json', nullable: true })
  httpConfig: {
    baseUrl?: string;
    authToken?: string;
    pollingInterval?: number;
  };

  @Column({ default: 30000 })
  connectionTimeout: number;

  @Column({ default: 5 })
  maxRetries: number;

  @Column({ default: 60000 })
  retryInterval: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 