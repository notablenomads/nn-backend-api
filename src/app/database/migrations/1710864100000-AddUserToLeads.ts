import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserToLeads1710864100000 implements MigrationInterface {
  name = 'AddUserToLeads1710864100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add userId column
    await queryRunner.query(`
      ALTER TABLE "leads"
      ADD COLUMN "userId" uuid
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "leads"
      ADD CONSTRAINT "FK_leads_users"
      FOREIGN KEY ("userId")
      REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    // Add index for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_leads_userId" ON "leads" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query('DROP INDEX "IDX_leads_userId"');

    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "leads"
      DROP CONSTRAINT "FK_leads_users"
    `);

    // Remove userId column
    await queryRunner.query(`
      ALTER TABLE "leads"
      DROP COLUMN "userId"
    `);
  }
}
