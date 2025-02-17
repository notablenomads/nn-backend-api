import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppPlatformAiMlStatusToLeads1739790031047 implements MigrationInterface {
  name = 'AddAppPlatformAiMlStatusToLeads1739790031047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."leads_mobileappplatform_enum" AS ENUM('IOS', 'ANDROID', 'BOTH')`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "mobileAppPlatform" "public"."leads_mobileappplatform_enum"`);
    await queryRunner.query(`CREATE TYPE "public"."leads_aimldatasetstatus_enum" AS ENUM('YES', 'NO', 'NOT_SURE')`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "aimlDatasetStatus" "public"."leads_aimldatasetstatus_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "aimlDatasetStatus"`);
    await queryRunner.query(`DROP TYPE "public"."leads_aimldatasetstatus_enum"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "mobileAppPlatform"`);
    await queryRunner.query(`DROP TYPE "public"."leads_mobileappplatform_enum"`);
  }
}
