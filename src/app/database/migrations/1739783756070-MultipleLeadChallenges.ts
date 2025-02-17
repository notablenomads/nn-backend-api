import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultipleLeadChallenges1739783756070 implements MigrationInterface {
  name = 'MultipleLeadChallenges1739783756070';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First drop the column since we're changing its type
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "existingProjectChallenge"`);

    // Create the new enum type if it doesn't exist
    await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."leads_existingprojectchallenges_enum" AS ENUM('PERFORMANCE', 'SCALABILITY', 'BUGS', 'UX', 'OTHER');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);

    // Add the new column with array type
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "existingProjectChallenges" "public"."leads_existingprojectchallenges_enum" array`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new column
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "existingProjectChallenges"`);

    // Create the old enum type
    await queryRunner.query(`DO $$ BEGIN
            CREATE TYPE "public"."leads_existingprojectchallenge_enum" AS ENUM('PERFORMANCE', 'SCALABILITY', 'BUGS', 'UX', 'OTHER');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;`);

    // Add back the original column
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "existingProjectChallenge" "public"."leads_existingprojectchallenge_enum"`,
    );
  }
}
