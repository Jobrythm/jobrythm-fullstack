import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { Job } from './Job.js';

@Entity('expenses')
export class Expense extends BaseEntity {
  @Column()
  companyId!: string;

  @Column({ nullable: true })
  jobId?: string;

  @ManyToOne('Job', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'jobId' })
  job?: Relation<Job>;

  @Column()
  description!: string;

  @Column({ type: 'bigint' })
  amountCents!: number; // always integer cents

  @Column({ type: 'varchar', default: 'other' })
  category!: string; // 'materials' | 'labor' | 'equipment' | 'fuel' | 'subcontractor' | 'other'

  @Column({ type: 'date' })
  date!: string; // ISO date string YYYY-MM-DD

  @Column({ default: false })
  isBillable!: boolean;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ nullable: true })
  receiptFileName?: string; // stored filename if receipt uploaded
}
