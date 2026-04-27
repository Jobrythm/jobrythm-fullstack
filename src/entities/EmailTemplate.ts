import { Entity, Column } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';

@Entity('email_templates')
export class EmailTemplate extends BaseEntity {
  @Column()
  name!: string;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  bodyHtml!: string;

  @Column({ type: 'text', nullable: true })
  bodyText?: string;
}
