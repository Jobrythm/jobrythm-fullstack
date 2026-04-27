import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export type IntegrationProvider = 'quickbooks' | 'xero';

@Entity('oauth_tokens')
export class OAuthToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ type: 'varchar' })
  provider!: IntegrationProvider;

  @Column({ type: 'text' })
  accessToken!: string;

  @Column({ type: 'text', nullable: true })
  refreshToken!: string | null;

  @Column({ type: 'bigint', nullable: true })
  expiresAt!: number | null;

  /** QuickBooks realm ID (company ID) */
  @Column({ nullable: true })
  realmId!: string | null;

  /** Xero tenant ID */
  @Column({ nullable: true })
  tenantId!: string | null;

  @Column({ type: 'datetime', nullable: true })
  lastSyncAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
