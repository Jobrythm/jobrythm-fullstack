import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { CampaignStatus } from '../types/enums.js';

@Entity('email_campaigns')
export class EmailCampaign extends BaseEntity {
  @Column()
  name!: string;

  @Column({ nullable: true })
  templateId?: string;

  @Column()
  subject!: string;

  /** JSON-encoded string array of recipient email addresses */
  @Column({ type: 'text' })
  recipientsJson!: string;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status!: CampaignStatus;

  @Column({ nullable: true })
  sentAt?: Date;

  @Column({ default: 0 })
  recipientCount!: number;
}
