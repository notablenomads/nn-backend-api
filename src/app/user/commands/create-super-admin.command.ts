import { Command, CommandRunner } from 'nest-commander';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../../core/enums/role.enum';

interface ICreateSuperAdminOptions {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

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

  async run(passedParams: string[], options?: ICreateSuperAdminOptions): Promise<void> {
    if (!options?.email || !options?.password) {
      this.logger.error('Email and password are required');
      return;
    }

    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: options.email },
      });

      if (existingUser) {
        this.logger.error('User with this email already exists');
        return;
      }

      const user = this.userRepository.create({
        email: options.email,
        password: options.password,
        firstName: options.firstName || 'Super',
        lastName: options.lastName || 'Admin',
        roles: [Role.SUPER_ADMIN],
        isActive: true,
      });

      await this.userRepository.save(user);
      this.logger.log(`Super admin created successfully: ${user.email}`);
    } catch (error) {
      this.logger.error('Failed to create super admin:', error.message);
    }
  }
}
