import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { AdPlatform } from '../types/enums.js';

@Entity('ad_platform_connections')
export class AdPlatformConnection extends BaseEntity {
  @Column({ type: 'enum', enum: AdPlatform })
  platform!: AdPlatform;

  @Column({ type: 'text' })
  accessToken!: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  tokenExpiresAt?: Date;

  @Column({ nullable: true })
  accountId?: string;

  @Column({ nullable: true })
  accountName?: string;

  /** The admin user who connected this platform */
  @Column()
  adminUserId!: string;
}
