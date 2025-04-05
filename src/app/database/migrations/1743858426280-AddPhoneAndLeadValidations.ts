import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneAndLeadValidations1743858426280 implements MigrationInterface {
  name = 'AddPhoneAndLeadValidations1743858426280';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" ADD "phone" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "phone"`);
  }
}
