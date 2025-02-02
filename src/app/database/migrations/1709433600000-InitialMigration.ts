import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1709433600000 implements MigrationInterface {
  name = 'InitialMigration1709433600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "leads_projecttype_enum" AS ENUM ('NEW', 'EXISTING')
    `);

    await queryRunner.query(`
      CREATE TYPE "leads_existingprojectchallenge_enum" AS ENUM (
        'PERFORMANCE',
        'SCALABILITY',
        'BUGS',
        'UX',
        'OTHER'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "leads_targetaudience_enum" AS ENUM (
        'CONSUMERS',
        'BUSINESSES',
        'BOTH'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "leads_industry_enum" AS ENUM (
        'ECOMMERCE',
        'HEALTHCARE',
        'EDUCATION',
        'SAAS',
        'FINANCE',
        'ENTERTAINMENT',
        'OTHER'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "leads_designstyle_enum" AS ENUM (
        'MODERN',
        'BOLD',
        'PROFESSIONAL',
        'UNDECIDED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "leads_timeline_enum" AS ENUM (
        'LESS_THAN_3_MONTHS',
        'THREE_TO_SIX_MONTHS',
        'MORE_THAN_6_MONTHS',
        'FLEXIBLE'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "leads_budget_enum" AS ENUM (
        'LESS_THAN_10K',
        'TEN_TO_FIFTY_K',
        'FIFTY_TO_HUNDRED_K',
        'MORE_THAN_100K',
        'NOT_SURE'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "leads_preferredcontactmethod_enum" AS ENUM (
        'EMAIL',
        'PHONE',
        'WHATSAPP'
      )
    `);

    // Create leads table
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "services" text[] NOT NULL,
        "projectType" "leads_projecttype_enum" NOT NULL,
        "existingProjectChallenge" "leads_existingprojectchallenge_enum",
        "projectDescription" text NOT NULL,
        "targetAudience" "leads_targetaudience_enum" NOT NULL,
        "industry" "leads_industry_enum" NOT NULL,
        "hasCompetitors" boolean NOT NULL,
        "competitorUrls" text[],
        "hasExistingBrand" boolean NOT NULL,
        "designStyle" "leads_designstyle_enum" NOT NULL,
        "timeline" "leads_timeline_enum" NOT NULL,
        "budget" "leads_budget_enum" NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "company" text,
        "preferredContactMethod" "leads_preferredcontactmethod_enum" NOT NULL,
        "wantsConsultation" boolean NOT NULL,
        "additionalNotes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leads" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop leads table
    await queryRunner.query('DROP TABLE "leads"');

    // Drop enum types
    await queryRunner.query('DROP TYPE "leads_preferredcontactmethod_enum"');
    await queryRunner.query('DROP TYPE "leads_budget_enum"');
    await queryRunner.query('DROP TYPE "leads_timeline_enum"');
    await queryRunner.query('DROP TYPE "leads_designstyle_enum"');
    await queryRunner.query('DROP TYPE "leads_industry_enum"');
    await queryRunner.query('DROP TYPE "leads_targetaudience_enum"');
    await queryRunner.query('DROP TYPE "leads_existingprojectchallenge_enum"');
    await queryRunner.query('DROP TYPE "leads_projecttype_enum"');
  }
}
