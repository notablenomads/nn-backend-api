import { MigrationInterface, QueryRunner } from 'typeorm';
import { TechnicalExpertise } from '../../lead/enums/lead.enum';

export class AddFeaturesToLeadUpdated1740240645984 implements MigrationInterface {
  name = 'AddFeaturesToLeadUpdated1740240645984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, update existing records to have a default value
    await queryRunner.query(`
      UPDATE "leads"
      SET "technicalExpertise" = '${TechnicalExpertise.NON_TECHNICAL}'
      WHERE "technicalExpertise" IS NULL
    `);

    // Then make the column non-nullable
    await queryRunner.query(`
      ALTER TABLE "leads"
      ALTER COLUMN "technicalExpertise" SET NOT NULL
    `);

    // Add other columns if they don't exist
    await queryRunner.query(`
      DO $$ BEGIN
        BEGIN
          ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "technicalFeatures" text[] NULL;
        EXCEPTION
          WHEN duplicate_column THEN
            NULL;
        END;
        
        BEGIN
          ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "nonTechnicalDescription" text NULL;
        EXCEPTION
          WHEN duplicate_column THEN
            NULL;
        END;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Make the column nullable again
    await queryRunner.query(`
      ALTER TABLE "leads"
      ALTER COLUMN "technicalExpertise" DROP NOT NULL
    `);

    // Remove the other columns
    await queryRunner.query(`
      ALTER TABLE "leads"
      DROP COLUMN IF EXISTS "technicalFeatures",
      DROP COLUMN IF EXISTS "nonTechnicalDescription"
    `);
  }
}
