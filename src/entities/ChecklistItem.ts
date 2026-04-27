import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { Job } from './Job.js';

@Entity('checklist_items')
export class ChecklistItem extends BaseEntity {
  @Column()
  jobId!: string;

  @ManyToOne('Job', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job!: Relation<Job>;

  @Column()
  companyId!: string;

  @Column()
  title!: string;

  @Column({ default: false })
  isCompleted!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ nullable: true, type: 'text' })
  notes?: string;
}
