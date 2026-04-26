import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { User } from './User.js';
import { Client } from './Client.js';
import { LineItem } from './LineItem.js';
import { Quote } from './Quote.js';
import { Invoice } from './Invoice.js';
import { JobStatus } from '../types/enums.js';

@Entity('jobs')
export class Job extends BaseEntity {
  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.jobs)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  clientId!: string;

  @ManyToOne(() => Client, (client) => client.jobs)
  @JoinColumn({ name: 'clientId' })
  client!: Client;

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

  @OneToMany(() => LineItem, (lineItem) => lineItem.job, { cascade: true })
  lineItems!: LineItem[];

  @OneToOne(() => Quote, (quote) => quote.job, { nullable: true })
  quote?: Quote;

  @OneToOne(() => Invoice, (invoice) => invoice.job, { nullable: true })
  invoice?: Invoice;

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
}
