import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('module_repositories')
export class ModuleRepository {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field()
  @Column()
  url: string;

  @Field()
  @Column({ default: 'main' })
  branch: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  @Column({ select: false, nullable: true })
  password?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  sshKey?: string;

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lastSyncedCommit?: string;

  @Field(() => Date, { nullable: true })
  @Column({ nullable: true })
  lastSyncedAt?: Date;

  @Field({ nullable: true })
  @Column({ type: 'int', default: 300000 })
  syncInterval?: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
} 