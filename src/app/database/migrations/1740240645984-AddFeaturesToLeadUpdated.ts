import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeaturesToLeadUpdated1740240645984 implements MigrationInterface {
  name = 'AddFeaturesToLeadUpdated1740240645984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "technicalExpertise" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "technicalExpertise" DROP NOT NULL`);
  }
}
