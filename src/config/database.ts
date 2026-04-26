import { DataSource } from 'typeorm';
import { User } from '../entities/User.js';
import { Client } from '../entities/Client.js';
import { Job } from '../entities/Job.js';
import { LineItem } from '../entities/LineItem.js';
import { Quote } from '../entities/Quote.js';
import { Invoice } from '../entities/Invoice.js';
import { RefreshToken } from '../entities/RefreshToken.js';
import { NumberSequence } from '../entities/NumberSequence.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'jobrythm',
  // Enable synchronize for Docker deployments (auto-create tables)
  // For production with sensitive data, use migrations instead
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Client, Job, LineItem, Quote, Invoice, RefreshToken, NumberSequence],
  migrations: [],
  subscribers: [],
});
