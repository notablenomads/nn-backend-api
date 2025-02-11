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

console.log('Initializing database connection...');

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
    await dataSource.initialize();
    console.log('Database connection initialized successfully');

    const userRepository = dataSource.getRepository(User);

    const email = process.argv[2];

    if (!email) {
      console.error('Please provide email as argument');
      console.error('Usage: ts-node scripts/create-super-admin.ts <email>');
      process.exit(1);
    }

    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
      console.error('Please set ADMIN_PASSWORD environment variable');
      process.exit(1);
    }

    // Check if any super admin already exists using array contains operator
    const existingSuperAdmin = await userRepository
      .createQueryBuilder('user')
      .where(':role = ANY(user.roles)', { role: Role.SUPER_ADMIN })
      .getOne();

    if (existingSuperAdmin) {
      console.error('A super admin user already exists in the system');
      console.error('For security reasons, only one super admin can be created using this script');
      console.error('Additional super admins can only be created by the existing super admin through the application');
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
    console.log('IMPORTANT: Please keep these credentials safe and secure!');
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
