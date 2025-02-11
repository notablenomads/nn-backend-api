import { Lead } from '../../lead/entities/lead.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Role } from '../../core/enums/role.enum';

export interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Role[];
  leads: Lead[];
  refreshTokens: RefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  hashPassword(): Promise<void>;
  validatePassword(password: string): Promise<boolean>;
}
