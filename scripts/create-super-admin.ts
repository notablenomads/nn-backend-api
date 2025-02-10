/* eslint-disable no-console */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../src/app/user/entities/user.entity';
import { Role } from '../src/app/core/enums/role.enum';
import { Lead } from '../src/app/lead/entities/lead.entity';
import { RefreshToken } from '../src/app/auth/entities/refresh-token.entity';
import { ApiKey } from '../src/app/auth/api-key/api-key.entity';

// Load environment variables
config();

console.log('Database config:', {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  database: process.env.DATABASE_NAME,
  schema: process.env.DATABASE_SCHEMA || 'public',
});

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  schema: process.env.DATABASE_SCHEMA || 'public',
  entities: [User, Lead, RefreshToken, ApiKey],
  synchronize: false,
});

async function createSuperAdmin() {
  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection initialized successfully');

    const userRepository = dataSource.getRepository(User);

    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.error('Please provide email and password as arguments');
      console.error('Usage: ts-node scripts/create-super-admin.ts <email> <password>');
      process.exit(1);
    }

    console.log('Checking if user exists...');
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      console.error('User with this email already exists');
      process.exit(1);
    }

    console.log('Creating super admin user...');
    const user = userRepository.create({
      email,
      password,
      firstName: 'Super',
      lastName: 'Admin',
      roles: [Role.SUPER_ADMIN],
      isActive: true,
    });

    await userRepository.save(user);
    console.log(`Super admin created successfully: ${user.email}`);
  } catch (error) {
    console.error('Failed to create super admin:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createSuperAdmin();
