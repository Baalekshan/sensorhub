import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Field, ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';

export enum PermissionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
  SPECIAL = 'SPECIAL'
}

export enum PermissionScope {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  DEVICE = 'DEVICE',
  SENSOR = 'SENSOR',
  READING = 'READING',
  ALERT = 'ALERT',
  FIRMWARE = 'FIRMWARE',
  REPORT = 'REPORT',
  DASHBOARD = 'DASHBOARD',
  SETTING = 'SETTING',
  SYSTEM = 'SYSTEM'
}

@ObjectType()
@Entity('permissions')
export class Permission {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description?: string;

  @Field(() => PermissionType)
  @Column({
    type: 'enum',
    enum: PermissionType
  })
  type: PermissionType;

  @Field(() => PermissionScope)
  @Column({
    type: 'enum',
    enum: PermissionScope
  })
  scope: PermissionScope;
  
  @Field()
  @Column()
  resource: string;
  
  @Field(() => [String])
  @Column('simple-array')
  actions: string[];

  @Field()
  @Column({ default: true })
  isActive: boolean;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;
} 