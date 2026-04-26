import { Entity, Column, OneToMany, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { Client } from './Client.js';
import type { Job } from './Job.js';
import type { RefreshToken } from './RefreshToken.js';
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

  @OneToMany('Client', 'user')
  clients!: Relation<Client[]>;

  @OneToMany('Job', 'user')
  jobs!: Relation<Job[]>;

  @OneToMany('RefreshToken', 'user')
  refreshTokens!: Relation<RefreshToken[]>;
}
