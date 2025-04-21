import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class ConfigurationVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  deviceId: string;

  @Column()
  @Index()
  version: number;

  @Column({ nullable: true })
  previousVersion: number;

  @Column({ type: 'json' })
  configBundle: any;

  @Column({ nullable: true })
  changeLog: string;

  @Column({ default: false })
  isRollback: boolean;

  @Column({ nullable: true })
  rollbackSource: number;

  @Column({ default: 'PENDING' })
  deploymentStatus: string;

  @Column({ nullable: true })
  deployedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}