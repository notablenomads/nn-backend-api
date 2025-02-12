import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefreshTokenFieldsOnly1739348419000 implements MigrationInterface {
  name = 'RefreshTokenFieldsOnly1739348419000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First drop all existing refresh tokens as they won't be valid anymore
    await queryRunner.query(`TRUNCATE TABLE "refresh_tokens" CASCADE`);

    // Remove old column
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "isRevoked"`);

    // Check and add new columns if they don't exist
    const hasColumn = async (columnName: string): Promise<boolean> => {
      const result = await queryRunner.query(
        `SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'refresh_tokens' 
          AND column_name = $1
        )`,
        [columnName],
      );
      return result[0].exists;
    };

    if (!(await hasColumn('iv'))) {
      await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "iv" character varying(32)`);
    }

    if (!(await hasColumn('authTag'))) {
      await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "authTag" character varying(64)`);
    }

    if (!(await hasColumn('isValid'))) {
      await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "isValid" boolean NOT NULL DEFAULT true`);
    }

    if (!(await hasColumn('wasUsed'))) {
      await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD "wasUsed" boolean NOT NULL DEFAULT false`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "wasUsed"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "isValid"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "authTag"`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "iv"`);
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "isRevoked" boolean NOT NULL DEFAULT false`,
    );
  }
}
