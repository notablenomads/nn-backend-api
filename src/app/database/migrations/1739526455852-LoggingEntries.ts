import { MigrationInterface, QueryRunner } from 'typeorm';

export class LoggingEntries1739526455852 implements MigrationInterface {
  name = 'LoggingEntries1739526455852';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_level_enum" AS ENUM('debug', 'info', 'warning', 'error', 'critical')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_actiontype_enum" AS ENUM('user_registration', 'user_registration_failed', 'user_login', 'user_login_failed', 'user_logout', 'user_created', 'user_updated', 'user_deleted', 'user_password_reset', 'user_email_verified', 'file_create', 'file_edit', 'file_delete', 'file_rename', 'file_move', 'code_execution', 'code_execution_error', 'code_compilation', 'code_compilation_error', 'chat_message_sent', 'chat_message_received', 'chat_session_started', 'chat_session_ended', 'chat_error', 'chat_rate_limited', 'system_error', 'system_warning', 'system_startup', 'system_shutdown', 'system_config_change', 'database_error', 'api_error', 'rate_limit_exceeded', 'security_violation')`,
    );
    await queryRunner.query(
      `CREATE TABLE "log_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "level" "public"."log_entries_level_enum" NOT NULL, "actionType" "public"."log_entries_actiontype_enum", "userId" character varying, "message" character varying NOT NULL, "metadata" jsonb, "stackTrace" text, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "sessionId" character varying, "requestId" character varying, "correlationId" character varying, "ipAddress" character varying, "userAgent" character varying, "environment" character varying, "component" character varying, "performanceMetrics" jsonb, "request" jsonb, "response" jsonb, "version" character varying, CONSTRAINT "PK_b226cc4051321f12106771581e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_c1544ddc5ab67b1c768ed74a5c" ON "log_entries" ("level") `);
    await queryRunner.query(`CREATE INDEX "IDX_a7724ba23dce7b743bd8e9e3e1" ON "log_entries" ("actionType") `);
    await queryRunner.query(`CREATE INDEX "IDX_6dfb67abaab46cdd5ab9f35e32" ON "log_entries" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_88410904513ed6cfdd598a777b" ON "log_entries" ("timestamp") `);
    await queryRunner.query(`CREATE INDEX "IDX_5486d7e7b0f610c7c500ab6d4e" ON "log_entries" ("sessionId") `);
    await queryRunner.query(`CREATE INDEX "IDX_25526fac41c8f70b5fe2c20e3d" ON "log_entries" ("requestId") `);
    await queryRunner.query(`CREATE INDEX "IDX_c0745e3ec5c6dfa839d265087e" ON "log_entries" ("correlationId") `);
    await queryRunner.query(`CREATE INDEX "IDX_16b243879409e99081dbbad819" ON "log_entries" ("environment") `);
    await queryRunner.query(`CREATE INDEX "IDX_783a90d5593bb7599dfabfb67a" ON "log_entries" ("component") `);
    await queryRunner.query(`CREATE INDEX "IDX_db721857dae233a523a77bd705" ON "log_entries" ("version") `);
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "isValid" SET DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "refresh_tokens" ALTER COLUMN "isValid" SET DEFAULT true`);
    await queryRunner.query(`DROP INDEX "public"."IDX_db721857dae233a523a77bd705"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_783a90d5593bb7599dfabfb67a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_16b243879409e99081dbbad819"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0745e3ec5c6dfa839d265087e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_25526fac41c8f70b5fe2c20e3d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5486d7e7b0f610c7c500ab6d4e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_88410904513ed6cfdd598a777b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6dfb67abaab46cdd5ab9f35e32"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a7724ba23dce7b743bd8e9e3e1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c1544ddc5ab67b1c768ed74a5c"`);
    await queryRunner.query(`DROP TABLE "log_entries"`);
    await queryRunner.query(`DROP TYPE "public"."log_entries_actiontype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."log_entries_level_enum"`);
  }
}
