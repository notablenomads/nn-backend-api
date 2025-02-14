import { Repository } from 'typeorm';
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../core/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { LoggingService } from '../logging/services/logging.service';
import { LogActionType } from '../logging/entities/log-entry.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly loggingService: LoggingService,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async register(userData: { email: string; firstName: string; lastName: string; password: string }): Promise<User> {
    try {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        await this.loggingService.logUserAction(
          LogActionType.USER_REGISTRATION_FAILED,
          `Registration failed: Email already exists: ${userData.email}`,
          { metadata: { email: userData.email } },
        );
        throw new ConflictException('User with this email already exists');
      }

      const user = this.userRepository.create({
        ...userData,
        roles: [Role.USER],
        isActive: true,
      });

      const savedUser = await this.userRepository.save(user);
      await this.loggingService.logUserAction(
        LogActionType.USER_CREATED,
        `User created successfully: ${userData.email}`,
        { userId: savedUser.id },
      );
      return savedUser;
    } catch (error) {
      await this.loggingService.logError(`Error creating user: ${userData.email}`, error, {
        metadata: { email: userData.email },
      });
      throw error;
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      ...createUserDto,
      roles: [Role.USER], // Default role
    });
    return this.userRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    try {
      await this.userRepository.update(id, updateData);
      const updatedUser = await this.findById(id);
      await this.loggingService.logUserAction(LogActionType.USER_UPDATED, `User updated successfully: ${id}`, {
        userId: id,
        metadata: {
          updatedFields: Object.keys(updateData),
        },
      });
      return updatedUser;
    } catch (error) {
      await this.loggingService.logError(`Error updating user: ${id}`, error, {
        userId: id,
        metadata: { updatedFields: Object.keys(updateData) },
      });
      throw error;
    }
  }
}
