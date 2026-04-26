import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { User } from './User.js';
import type { Job } from './Job.js';

@Entity('clients')
export class Client extends BaseEntity {
  @Column()
  userId!: string;

  @ManyToOne('User', 'clients')
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column()
  name!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, type: 'text' })
  address?: string;

  @OneToMany('Job', 'client')
  jobs!: Relation<Job[]>;
}
