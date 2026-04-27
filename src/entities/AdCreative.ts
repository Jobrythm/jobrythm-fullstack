import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { AdPlatform, AdCreativeType } from '../types/enums.js';

@Entity('ad_creatives')
export class AdCreative extends BaseEntity {
  @Column({ type: 'enum', enum: AdPlatform })
  platform!: AdPlatform;

  @Column({ type: 'enum', enum: AdCreativeType })
  type!: AdCreativeType;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  body?: string;

  @Column({ nullable: true })
  mediaUrl?: string;

  /** ID of the creative on the external ad platform, if uploaded */
  @Column({ nullable: true })
  platformCreativeId?: string;
}
