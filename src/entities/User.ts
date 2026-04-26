import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { Client } from './Client.js';
import { Job } from './Job.js';
import { RefreshToken } from './RefreshToken.js';
import { SubscriptionPlan } from '../types/enums.js';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  companyAddress?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 20 })
  defaultVatRate!: number;

  @Column({ nullable: true })
  defaultPaymentTerms?: string;

  @Column({ default: 30 })
  defaultQuoteValidityDays!: number;

  @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.STARTER })
  plan!: SubscriptionPlan;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @Column({ nullable: true })
  subscriptionEndsAt?: Date;

  @OneToMany(() => Client, (client) => client.user)
  clients!: Client[];

  @OneToMany(() => Job, (job) => job.user)
  jobs!: Job[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}
