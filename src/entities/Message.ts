import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Job } from './Job.js';

@Entity('messages')
export class Message extends BaseEntity {
  @Column()
  jobId!: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job!: Relation<Job>;

  // 'contractor' = sent by the business owner/sub-user; 'client' = sent by client via public link
  @Column({ type: 'varchar', default: 'contractor' })
  senderType!: 'contractor' | 'client';

  @Column({ type: 'text' })
  senderName!: string;

  @Column({ type: 'text' })
  body!: string;

  // true when an email notification was sent to the other party
  @Column({ type: 'boolean', default: false })
  emailSent!: boolean;
}
