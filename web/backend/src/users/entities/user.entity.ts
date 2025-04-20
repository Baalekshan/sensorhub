import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import { Device } from '../../devices/entities/device.entity';
import { Alert } from '../../notifications/entities/alert.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Field()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  googleId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  appleId?: string;

  @Field(() => [Device], { nullable: true })
  @OneToMany(() => Device, (device) => device.user)
  devices?: Device[];

  @Field(() => [Alert], { nullable: true })
  @OneToMany(() => Alert, (alert) => alert.user)
  alerts?: Alert[];

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;
} 