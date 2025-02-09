import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1710864200000 implements MigrationInterface {
  name = 'CreateRefreshTokensTable1710864200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "userAgent" character varying,
        "ipAddress" character varying,
        "isValid" boolean NOT NULL DEFAULT true,
        "revokedAt" TIMESTAMP,
        "revokedByIp" character varying,
        "replacedByToken" character varying,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") 
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Add index for faster token lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token")
    `);

    // Add index for user relationship
    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_userId" ON "refresh_tokens" ("userId")
    `);

    // Remove the old refreshToken column from users table
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshToken"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back the refreshToken column to users table
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "refreshToken" character varying
    `);

    // Drop indexes
    await queryRunner.query('DROP INDEX "IDX_refresh_tokens_userId"');
    await queryRunner.query('DROP INDEX "IDX_refresh_tokens_token"');

    // Drop refresh_tokens table
    await queryRunner.query('DROP TABLE "refresh_tokens"');
  }
}
