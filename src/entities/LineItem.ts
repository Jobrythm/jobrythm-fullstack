import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { Job } from './Job.js';
import { LineItemCategory } from '../types/enums.js';

@Entity('line_items')
export class LineItem extends BaseEntity {
  @Column()
  jobId!: string;

  @ManyToOne('Job', 'lineItems', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job!: Relation<Job>;

  @Column()
  description!: string;

  @Column({ type: 'enum', enum: LineItemCategory })
  category!: LineItemCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Column({ nullable: true })
  unit?: string;

  @Column({ type: 'bigint' }) // stored as pence/cents
  unitCost!: number;

  @Column({ type: 'bigint' }) // stored as pence/cents
  unitPrice!: number;

  get totalCost(): number {
    return Number(this.unitCost) * Number(this.quantity);
  }

  get totalPrice(): number {
    return Number(this.unitPrice) * Number(this.quantity);
  }

  get marginPercent(): number {
    return this.totalPrice > 0 ? ((this.totalPrice - this.totalCost) / this.totalPrice) * 100 : 0;
  }

  toJSON() {
    return {
      id: this.id,
      jobId: this.jobId,
      description: this.description,
      category: this.category,
      quantity: Number(this.quantity),
      unit: this.unit,
      unitCost: Number(this.unitCost),
      unitPrice: Number(this.unitPrice),
      totalCost: this.totalCost,
      totalPrice: this.totalPrice,
      marginPercent: this.marginPercent,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
