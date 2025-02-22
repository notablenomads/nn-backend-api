import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeaturesToLead1740236874593 implements MigrationInterface {
  name = 'AddFeaturesToLead1740236874593';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."leads_technicalexpertise_enum" AS ENUM('TECHNICAL', 'NON_TECHNICAL')`,
    );
    await queryRunner.query(`ALTER TABLE "leads" ADD "technicalExpertise" "public"."leads_technicalexpertise_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."leads_technicalfeatures_enum" AS ENUM('AUTHENTICATION', 'USER_MANAGEMENT', 'SOCIAL_LOGIN', 'FILE_HANDLING', 'SEARCH_FILTER', 'NOTIFICATIONS', 'ADMIN_PANEL', 'PAYMENTS', 'ANALYTICS', 'MESSAGING', 'CALENDAR', 'SEO_OPTIMIZATION', 'SOCIAL_SHARING', 'REFERRAL_SYSTEM', 'MARKETING_TOOLS', 'SHOPPING_CART', 'INVENTORY', 'ORDER_MANAGEMENT', 'PRODUCT_MANAGEMENT', 'API_INTEGRATION', 'MOBILE_SYNC', 'ANALYTICS_TRACKING', 'OFFLINE_MODE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "leads" ADD "technicalFeatures" "public"."leads_technicalfeatures_enum" array`,
    );
    await queryRunner.query(`ALTER TABLE "leads" ADD "nonTechnicalDescription" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "nonTechnicalDescription"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "technicalFeatures"`);
    await queryRunner.query(`DROP TYPE "public"."leads_technicalfeatures_enum"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "technicalExpertise"`);
    await queryRunner.query(`DROP TYPE "public"."leads_technicalexpertise_enum"`);
  }
}
