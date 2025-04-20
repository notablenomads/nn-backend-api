import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropApiKeysTable1745169517861 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the api_keys table if it exists
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the api_keys table
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
  }
}
