import { DataSource } from 'typeorm';

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
  entities: ['dist/entities/**/*.js'],
  migrations: [],
  subscribers: [],
});
