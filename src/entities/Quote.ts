import { Entity, Column, OneToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { Job } from './Job.js';
import { QuoteStatus } from '../types/enums.js';

@Entity('quotes')
export class Quote extends BaseEntity {
  @Column()
  jobId!: string;

  @OneToOne('Job', 'quote')
  @JoinColumn({ name: 'jobId' })
  job!: Relation<Job>;

  @Column({ unique: true })
  quoteNumber!: string;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.DRAFT })
  status!: QuoteStatus;

  @Column({ nullable: true })
  validUntil?: Date;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ nullable: true, type: 'text' })
  terms?: string;

  @Column({ type: 'bigint' })
  totalNet!: number;

  @Column({ type: 'int' })
  vatRate!: number;

  @Column({ type: 'bigint' })
  vatAmount!: number;

  @Column({ type: 'bigint' })
  totalGross!: number;

  @Column({ nullable: true })
  sentAt?: Date;

  @Column({ nullable: true })
  acceptedAt?: Date;

  @Column({ unique: true, nullable: true })
  publicToken?: string;
}
