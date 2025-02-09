import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedRefreshTokenColumns1710864400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_tokens');
    if (!table) {
      return;
    }

    // Drop unused columns
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      DROP COLUMN IF EXISTS "userAgent",
      DROP COLUMN IF EXISTS "ipAddress",
      DROP COLUMN IF EXISTS "revokedAt",
      DROP COLUMN IF EXISTS "revokedByIp",
      DROP COLUMN IF EXISTS "replacedByToken"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back removed columns if needed
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD COLUMN IF NOT EXISTS "userAgent" character varying,
      ADD COLUMN IF NOT EXISTS "ipAddress" character varying,
      ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "revokedByIp" character varying,
      ADD COLUMN IF NOT EXISTS "replacedByToken" character varying
    `);
  }
}
