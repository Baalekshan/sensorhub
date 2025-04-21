import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { MessagePriority, MessageType } from '../types/messaging.types';

@Entity()
export class MessageQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  deviceId: string;

  @Column()
  messageId: string;

  @Column({
    type: 'enum',
    enum: MessageType,
  })
  messageType: MessageType;

  @Column({ type: 'json' })
  payload: any;

  @Column({
    type: 'enum',
    enum: MessagePriority,
    default: MessagePriority.MEDIUM
  })
  priority: MessagePriority;

  @Column({ type: 'bigint' })
  timestamp: number;

  @Column({ default: 3600000 }) // Default TTL: 1 hour
  ttl: number;

  @Column({
    default: 'QUEUED',
    enum: ['QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'EXPIRED']
  })
  status: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  lastRetryAt: Date;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 