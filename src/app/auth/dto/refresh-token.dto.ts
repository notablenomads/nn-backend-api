export class CreateRefreshTokenDto {
  token: string;
  iv: string;
  authTag: string;
  userId: string;
  expiresAt: Date;
  isValid: boolean;
}

export class RefreshTokenResponseDto {
  id: string;
  token: string;
  expiresAt: Date;
  isValid: boolean;
  userId: string;
}
