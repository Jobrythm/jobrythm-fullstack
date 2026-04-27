import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { User } from './User.js';
import type { Job } from './Job.js';

@Entity('checklists')
export class Checklist extends BaseEntity {
  @Column()
  userId!: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column()
  jobId!: string;

  @ManyToOne('Job', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job!: Relation<Job>;

  @Column()
  title!: string;

  @OneToMany('ChecklistItem', 'checklist', { cascade: true })
  items!: Relation<ChecklistItem[]>;
}

@Entity('checklist_items')
export class ChecklistItem extends BaseEntity {
  @Column()
  checklistId!: string;

  @ManyToOne('Checklist', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistId' })
  checklist!: Relation<Checklist>;

  @Column()
  label!: string;

  @Column({ default: false })
  checked!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
