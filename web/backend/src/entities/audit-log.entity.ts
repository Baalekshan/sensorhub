import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Field, ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { User } from './user.entity';

export enum AuditLogType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM'
}

export enum AuditLogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

@ObjectType()
@Entity('audit_logs')
export class AuditLog {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => AuditLogType)
  @Column({
    type: 'enum',
    enum: AuditLogType
  })
  type: AuditLogType;

  @Field()
  @Column()
  action: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  entityType?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  entityId?: string;

  @Field(() => Object, { nullable: true })
  @Column({ type: 'json', nullable: true })
  details?: Record<string, any>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  userAgent?: string;

  @Field(() => AuditLogSeverity)
  @Column({
    type: 'enum',
    enum: AuditLogSeverity,
    default: AuditLogSeverity.INFO
  })
  severity: AuditLogSeverity;

  @Field({ nullable: true })
  @Column({ nullable: true })
  userId?: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;
} 