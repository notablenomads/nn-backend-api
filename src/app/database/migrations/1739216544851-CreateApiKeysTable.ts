import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiKeysTable1739216544851 implements MigrationInterface {
  name = 'CreateApiKeysTable1739216544851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT "FK_6c57527dc398a02b2e0ffa96969"`);
    await queryRunner.query(
      `CREATE TABLE "api_keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hashedKey" character varying NOT NULL, "description" character varying, "isActive" boolean NOT NULL DEFAULT true, "expiresAt" TIMESTAMP NOT NULL, "lastUsedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0d632a6c3b16bc708bf0987fed2" UNIQUE ("hashedKey"), CONSTRAINT "PK_5c8a79801b44bd27b79228e1dad" PRIMARY KEY ("id"))`,
    );
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
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(
      `ALTER TABLE "leads" ADD CONSTRAINT "FK_6c57527dc398a02b2e0ffa96969" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
