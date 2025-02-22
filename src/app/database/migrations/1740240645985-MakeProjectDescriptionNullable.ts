import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeProjectDescriptionNullable1740240645985 implements MigrationInterface {
  name = 'MakeProjectDescriptionNullable1740240645985';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "leads"
      ALTER COLUMN "projectDescription" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "leads"
      ALTER COLUMN "projectDescription" SET NOT NULL
    `);
  }
}
