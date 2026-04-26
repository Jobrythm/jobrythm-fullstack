import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import { User } from './User.js';
import { Job } from './Job.js';

@Entity('clients')
export class Client extends BaseEntity {
  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.clients)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  name!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, type: 'text' })
  address?: string;

  @OneToMany(() => Job, (job) => job.client)
  jobs!: Job[];
}
