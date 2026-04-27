import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';

@Entity('app_settings')
export class AppSettings extends BaseEntity {
  @Column({ unique: true })
  key!: string;

  @Column({ type: 'text', nullable: true })
  value?: string;
}
