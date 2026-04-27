import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { User } from './User.js';
import type { Job } from './Job.js';

@Entity('time_entries')
export class TimeEntry extends BaseEntity {
  @Column()
  userId!: string;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column({ nullable: true })
  jobId?: string;

  @ManyToOne('Job', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'jobId' })
  job?: Relation<Job>;

  @Column({ nullable: true })
  teamMemberId?: string; // who did the work (if different from userId)

  @Column({ type: 'timestamp' })
  startTime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  // Duration in minutes (computed or overridden)
  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ default: false })
  isBillable!: boolean;

  // Hourly rate in cents for billing
  @Column({ type: 'bigint', nullable: true })
  hourlyRateCents?: number;
}
