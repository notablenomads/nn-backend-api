import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRefreshTokenColumnFromUsers1710864300000 implements MigrationInterface {
  name = 'RemoveRefreshTokenColumnFromUsers1710864300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshToken"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "refreshToken" character varying
    `);
  }
}
