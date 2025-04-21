import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class SensorProtocol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  version: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  schema: {
    properties?: Record<string, any>;
    required?: string[];
    communication?: {
      busType: 'i2c' | 'spi' | 'uart' | 'digital' | 'analog' | 'onewire';
      i2c?: {
        defaultAddress?: string;
        addressRange?: string[];
        speedModes?: string[];
      };
      spi?: {
        maxSpeed?: number;
        mode?: number;
        bitOrder?: string;
      };
      uart?: {
        baudRate?: number;
        dataBits?: number;
        parity?: string;
        stopBits?: number;
      };
      digital?: {
        activeLow?: boolean;
        pullUp?: boolean;
      };
      analog?: {
        minVoltage?: number;
        maxVoltage?: number;
        resolution?: number;
      };
    };
    dataFormat?: {
      readings?: {
        type: string;
        unit: string;
        minValue?: number;
        maxValue?: number;
        precision?: number;
      }[];
    };
    commands?: Record<string, any>[];
  };

  @Column({ type: 'json', nullable: true })
  defaultConfig: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  calibrationMethods: {
    method: string;
    parameters: Record<string, any>;
    description: string;
  }[];

  @Column({ nullable: true })
  documentationUrl: string;

  @Column({ default: true })
  published: boolean;

  @Column({ nullable: true })
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 