import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveNonTechnicalDescription1743859717714 implements MigrationInterface {
  name = 'RemoveNonTechnicalDescription1743859717714';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "nonTechnicalDescription"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ADD "nonTechnicalDescription" text`);
  }
}
