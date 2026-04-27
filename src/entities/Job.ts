import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { User } from './User.js';
import type { Client } from './Client.js';
import type { LineItem } from './LineItem.js';
import type { Quote } from './Quote.js';
import type { Invoice } from './Invoice.js';
import { JobStatus } from '../types/enums.js';

@Entity('jobs')
export class Job extends BaseEntity {
  @Column()
  userId!: string;

  @ManyToOne('User', 'jobs')
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column()
  clientId!: string;

  @ManyToOne('Client', 'jobs')
  @JoinColumn({ name: 'clientId' })
  client!: Relation<Client>;

  @Column()
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status!: JobStatus;

  @Column({ nullable: true })
  startDate?: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @OneToMany('LineItem', 'job', { cascade: true })
  lineItems!: Relation<LineItem[]>;

  @OneToOne('Quote', 'job', { nullable: true })
  quote?: Relation<Quote>;

  @OneToOne('Invoice', 'job', { nullable: true })
  invoice?: Relation<Invoice>;

  get totalCost(): number {
    return this.lineItems?.reduce((sum, item) => sum + item.totalCost, 0) || 0;
  }

  get totalRevenue(): number {
    return this.lineItems?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  }

  get marginAmount(): number {
    return this.totalRevenue - this.totalCost;
  }

  get marginPercent(): number {
    return this.totalRevenue > 0 ? (this.marginAmount / this.totalRevenue) * 100 : 0;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      clientId: this.clientId,
      title: this.title,
      description: this.description,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      client: this.client,
      lineItems: this.lineItems,
      quote: this.quote,
      invoice: this.invoice,
      totalCost: this.totalCost,
      totalRevenue: this.totalRevenue,
      marginAmount: this.marginAmount,
      marginPercent: this.marginPercent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
