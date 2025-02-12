import { Command, CommandRunner } from 'nest-commander';
import { Repository } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../core/enums/role.enum';

@Injectable()
@Command({
  name: 'create-super-admin',
  description: 'Create a super admin user',
})
export class CreateSuperAdminCommand extends CommandRunner {
  private readonly logger = new Logger(CreateSuperAdminCommand.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    try {
      const [email] = inputs;

      if (!email) {
        this.logger.error('Please provide email as argument');
        this.logger.error('Usage: npm run cli -- create-super-admin <email>');
        process.exit(1);
      }

      const password = process.env.ADMIN_PASSWORD;
      if (!password) {
        this.logger.error('Please set ADMIN_PASSWORD environment variable');
        process.exit(1);
      }

      // Check if any super admin already exists using array contains operator
      const existingSuperAdmin = await this.userRepository
        .createQueryBuilder('user')
        .where(':role = ANY(user.roles)', { role: Role.SUPER_ADMIN })
        .getCount();

      if (existingSuperAdmin > 0) {
        this.logger.error('A super admin user already exists in the system');
        this.logger.error('For security reasons, only one super admin can be created using this script');
        this.logger.error(
          'Additional super admins can only be created by the existing super admin through the application',
        );
        process.exit(1);
      }

      this.logger.log('Checking if user exists...');
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        this.logger.error('User with this email already exists');
        process.exit(1);
      }

      this.logger.log('Creating super admin user...');
      const user = this.userRepository.create({
        email,
        password,
        firstName: 'Super',
        lastName: 'Admin',
        roles: [Role.SUPER_ADMIN],
        isActive: true,
      });

      await this.userRepository.save(user);
      this.logger.log(`Super admin created successfully: ${user.email}`);
      this.logger.log('IMPORTANT: Please keep these credentials safe and secure!');
    } catch (error) {
      this.logger.error('Failed to create super admin:', error);
      if (error.stack) {
        this.logger.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  }
}
