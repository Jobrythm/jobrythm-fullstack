import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { AdPlatform, AdCampaignStatus } from '../types/enums.js';

@Entity('ad_campaigns')
export class AdCampaign extends BaseEntity {
  @Column({ type: 'enum', enum: AdPlatform })
  platform!: AdPlatform;

  /** ID assigned by the external ad platform */
  @Column({ nullable: true })
  platformCampaignId?: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: AdCampaignStatus, default: AdCampaignStatus.PAUSED })
  status!: AdCampaignStatus;

  /** Daily budget in cents */
  @Column({ default: 0 })
  budgetCents!: number;

  @Column({ nullable: true })
  startDate?: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column({ default: 0 })
  impressions!: number;

  @Column({ default: 0 })
  clicks!: number;

  /** Total spend in cents */
  @Column({ default: 0 })
  spendCents!: number;

  @Column({ nullable: true })
  lastSyncedAt?: Date;
}
