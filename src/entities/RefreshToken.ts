import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { BaseEntity } from './BaseEntity.js';
import type { User } from './User.js';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Column()
  userId!: string;

  @ManyToOne('User', 'refreshTokens')
  @JoinColumn({ name: 'userId' })
  user!: Relation<User>;

  @Column({ unique: true })
  tokenHash!: string;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  revokedAt?: Date;

  get isRevoked(): boolean {
    return !!this.revokedAt;
  }

  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  get isActive(): boolean {
    return !this.isRevoked && !this.isExpired;
  }
}
