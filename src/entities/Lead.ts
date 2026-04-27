import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { LeadStatus, LeadSource } from '../types/enums.js';

@Entity('leads')
export class Lead extends BaseEntity {
  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: LeadSource, default: LeadSource.OTHER })
  source!: LeadSource;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.LEAD })
  status!: LeadStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  assignedToUserId?: string;
}
