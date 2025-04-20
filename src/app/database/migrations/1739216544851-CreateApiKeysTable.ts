import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiKeysTable1739216544851 implements MigrationInterface {
  name = 'CreateApiKeysTable1739216544851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_6c57527dc398a02b2e0ffa96969"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "company"`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "company" character varying`);
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "isValid" SET DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now()`);
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_6c57527dc398a02b2e0ffa96969" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_6c57527dc398a02b2e0ffa96969"`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "isValid" SET DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "leads" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "leads" DROP COLUMN "company"`);
    await queryRunner.query(`ALTER TABLE "leads" ADD "company" text`);
    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "description" character varying,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        CONSTRAINT "PK_5c8a79801b44b13d4f4a9b3437c" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_5c8a79801b44b13d4f4a9b3437d" UNIQUE ("key"),
        CONSTRAINT "FK_5c8a79801b44b13d4f4a9b3437e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_6c57527dc398a02b2e0ffa96969" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
