import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { User } from './User.js';
import { TeamMemberRole } from '../types/enums.js';

@Entity('team_members')
export class TeamMember extends BaseEntity {
  @Column()
  ownerId!: string; // The contractor who owns this team

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: Relation<User>;

  @Column()
  name!: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: TeamMemberRole, default: TeamMemberRole.TECHNICIAN })
  role!: TeamMemberRole;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ default: true })
  isActive!: boolean;

  // Optional: link to a Jobrythm account (for future login support)
  @Column({ nullable: true })
  linkedUserId?: string;
}
