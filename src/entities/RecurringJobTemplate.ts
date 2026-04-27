import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Client } from './Client.js';

export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

@Entity('recurring_job_templates')
export class RecurringJobTemplate extends BaseEntity {
  @Column()
  userId!: string;

  @Column({ nullable: true })
  clientId?: string;

  @ManyToOne(() => Client, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client?: Relation<Client>;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar' })
  frequency!: RecurringFrequency;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ type: 'date', nullable: true })
  nextRunAt?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'int', default: 0 })
  jobsSpawned!: number;
}
