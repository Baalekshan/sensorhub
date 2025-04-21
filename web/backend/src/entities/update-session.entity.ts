import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { UpdateType, UpdateSessionState } from '../updates/update.types';

@Entity()
export class UpdateSession {
  @PrimaryColumn()
  id: string;

  @Column()
  @Index()
  deviceId: string;

  @Column({
    type: 'enum',
    enum: UpdateType
  })
  type: UpdateType;

  @Column({
    type: 'enum',
    enum: UpdateSessionState,
    default: UpdateSessionState.INITIATED
  })
  status: UpdateSessionState;

  @Column()
  sourceId: string;

  @Column()
  version: string;

  @Column({ nullable: true })
  checksum: string;

  @Column()
  totalChunks: number;

  @Column()
  chunkSize: number;

  @Column({ default: 0 })
  sentChunks: number;

  @Column({ default: 0 })
  acknowledgedChunks: number;

  @Column({ type: 'json', default: {} })
  options: {
    forceUpdate?: boolean;
    skipVerification?: boolean;
    updateTimeout?: number;
  };

  @Column()
  expectedDuration: number;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column()
  lastActivityAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
} 