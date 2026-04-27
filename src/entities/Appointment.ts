import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { User } from './User.js';
import type { Job } from './Job.js';
import type { Client } from './Client.js';
import { AppointmentStatus } from '../types/enums.js';

@Entity('appointments')
export class Appointment extends BaseEntity {
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
  clientId?: string;

  @ManyToOne('Client', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client?: Relation<Client>;

  @Column()
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ type: 'timestamp' })
  startTime!: Date;

  @Column({ type: 'timestamp' })
  endTime!: Date;

  @Column({ nullable: true, type: 'text' })
  location?: string;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status!: AppointmentStatus;

  @Column({ nullable: true })
  assignedTo?: string; // userId of assigned team member
}
