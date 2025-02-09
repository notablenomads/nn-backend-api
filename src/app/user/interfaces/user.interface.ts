import { Lead } from '../../lead/entities/lead.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

export interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  leads: Lead[];
  refreshTokens: RefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  hashPassword(): Promise<void>;
  validatePassword(password: string): Promise<boolean>;
}
