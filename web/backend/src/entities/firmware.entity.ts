import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Firmware {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  version: string;

  @Column()
  deviceType: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @Column()
  size: number;

  @Column()
  checksum: string;

  @Column({ type: 'text', nullable: true })
  changelog: string;

  @Column({ default: false })
  isProduction: boolean;

  @Column({ nullable: true })
  publishedBy: string;

  @Column({ nullable: true })
  organizationId: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 