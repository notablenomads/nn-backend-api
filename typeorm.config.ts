import { join } from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Load environment-specific .env file
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
config({ path: envFile });

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'notablenomads',
  schema: process.env.DATABASE_SCHEMA || 'public',
  entities: [join(__dirname, 'src', 'app', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src', 'app', 'database', 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: true,
});
