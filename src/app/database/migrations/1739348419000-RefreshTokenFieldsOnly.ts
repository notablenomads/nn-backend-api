import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefreshTokenFieldsOnly1739348419000 implements MigrationInterface {
  name = 'RefreshTokenFieldsOnly1739348419000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First drop all existing refresh tokens as they won't be valid anymore
    await queryRunner.query(`TRUNCATE TABLE "refresh_tokens" CASCADE`);

    // Remove old column
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "isRevoked"`);

    // Add new columns
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "iv" character varying(32)`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "authTag" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "isValid" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "wasUsed" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "wasUsed"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "isValid"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "authTag"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN "iv"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "isRevoked" boolean NOT NULL DEFAULT false`);
  }
}
