import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupAndRefineRefreshTokens1710864500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing table completely
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens" CASCADE');

    // Create a new, clean table with only the necessary fields
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "token" character varying(1000) NOT NULL,
        "iv" character varying(32) NOT NULL,
        "authTag" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "isValid" boolean NOT NULL DEFAULT true,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens" 
      ADD CONSTRAINT "FK_refresh_tokens_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    // Add indices for common queries
    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_token_valid" 
      ON "refresh_tokens" ("token") 
      WHERE "isValid" = true
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_userId_valid" 
      ON "refresh_tokens" ("userId") 
      WHERE "isValid" = true
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_expiresAt" 
      ON "refresh_tokens" ("expiresAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_refresh_tokens_token_valid"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_refresh_tokens_userId_valid"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_refresh_tokens_expiresAt"');

    // Drop the table
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens" CASCADE');
  }
}
