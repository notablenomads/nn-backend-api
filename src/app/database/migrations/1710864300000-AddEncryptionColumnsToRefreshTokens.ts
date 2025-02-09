import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEncryptionColumnsToRefreshTokens1710864300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First check if the table exists
    const tableExists = await queryRunner.hasTable('refresh_tokens');
    if (!tableExists) {
      await queryRunner.query(`
        CREATE TABLE "refresh_tokens" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "token" character varying(1000) NOT NULL,
          "userId" uuid NOT NULL,
          "expiresAt" TIMESTAMP NOT NULL,
          "userAgent" character varying,
          "ipAddress" character varying,
          "isValid" boolean NOT NULL DEFAULT true,
          "revokedAt" TIMESTAMP,
          "revokedByIp" character varying,
          "replacedByToken" character varying,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
          CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") 
            REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Check if columns already exist before adding them
    const hasIv = await queryRunner.hasColumn('refresh_tokens', 'iv');
    const hasAuthTag = await queryRunner.hasColumn('refresh_tokens', 'authTag');

    if (!hasIv) {
      await queryRunner.query(`
        ALTER TABLE "refresh_tokens" 
        ADD COLUMN "iv" character varying(32) NOT NULL DEFAULT ''
      `);
    }

    if (!hasAuthTag) {
      await queryRunner.query(`
        ALTER TABLE "refresh_tokens" 
        ADD COLUMN "authTag" character varying(64) NOT NULL DEFAULT ''
      `);
    }

    // Remove the default values after adding the columns
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" 
      ALTER COLUMN "iv" DROP DEFAULT,
      ALTER COLUMN "authTag" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('refresh_tokens');
    if (!tableExists) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" 
      DROP COLUMN IF EXISTS "iv",
      DROP COLUMN IF EXISTS "authTag"
    `);
  }
}
