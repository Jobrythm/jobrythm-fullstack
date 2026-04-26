import { Entity, Column, OneToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { Job } from './Job.js';
import { InvoiceStatus } from '../types/enums.js';

@Entity('invoices')
export class Invoice extends BaseEntity {
  @Column()
  jobId!: string;

  @OneToOne('Job', 'invoice')
  @JoinColumn({ name: 'jobId' })
  job!: Relation<Job>;

  @Column({ unique: true })
  invoiceNumber!: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status!: InvoiceStatus;

  @Column({ nullable: true })
  dueDate?: Date;

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
  paidAt?: Date;
}
