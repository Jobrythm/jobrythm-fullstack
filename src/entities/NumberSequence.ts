import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';

@Entity('number_sequences')
export class NumberSequence extends BaseEntity {
  @Column()
  userId!: string;

  @Column()
  prefix!: string;

  @Column({ default: 0 })
  lastNumber!: number;
}
