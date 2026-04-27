import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { User } from './User.js';
import type { Job } from './Job.js';

@Entity('attachments')
export class Attachment extends BaseEntity {
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
  fileName!: string;

  @Column()
  mimeType!: string;

  @Column({ type: 'bigint' })
  sizeBytes!: number;

  // URL (S3/cloud) or local path
  @Column({ type: 'text' })
  url!: string;

  @Column({ nullable: true, type: 'text' })
  caption?: string;
}
