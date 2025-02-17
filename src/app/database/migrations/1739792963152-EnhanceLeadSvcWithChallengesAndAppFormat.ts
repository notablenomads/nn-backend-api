import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceLeadSvcWithChallengesAndAppFormat1739792963152 implements MigrationInterface {
  name = 'EnhanceLeadSvcWithChallengesAndAppFormat1739792963152';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."leads_existingprojectchallenges_enum" RENAME TO "leads_existingprojectchallenges_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."leads_existingprojectchallenges_enum" AS ENUM('PERFORMANCE', 'SCALABILITY', 'BUGS', 'UX', 'SECURITY', 'MAINTENANCE', 'TECHNICAL_DEBT', 'OUTDATED', 'OTHER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ALTER COLUMN "existingProjectChallenges" TYPE "public"."leads_existingprojectchallenges_enum"[] USING "existingProjectChallenges"::"text"::"public"."leads_existingprojectchallenges_enum"[]`,
    );
    await queryRunner.query(`DROP TYPE "public"."leads_existingprojectchallenges_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."leads_existingprojectchallenges_enum_old" AS ENUM('BUGS', 'OTHER', 'PERFORMANCE', 'SCALABILITY', 'UX')`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ALTER COLUMN "existingProjectChallenges" TYPE "public"."leads_existingprojectchallenges_enum_old"[] USING "existingProjectChallenges"::"text"::"public"."leads_existingprojectchallenges_enum_old"[]`,
    );
    await queryRunner.query(`DROP TYPE "public"."leads_existingprojectchallenges_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."leads_existingprojectchallenges_enum_old" RENAME TO "leads_existingprojectchallenges_enum"`,
    );
  }
}
