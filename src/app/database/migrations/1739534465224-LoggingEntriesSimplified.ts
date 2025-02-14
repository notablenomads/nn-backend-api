import { MigrationInterface, QueryRunner } from 'typeorm';

export class LoggingEntriesSimplified1739534465224 implements MigrationInterface {
  name = 'LoggingEntriesSimplified1739534465224';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_5486d7e7b0f610c7c500ab6d4e"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "sessionId"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "userAgent"`);
    await queryRunner.query(`ALTER TABLE "log_entries" DROP COLUMN "performanceMetrics"`);
    await queryRunner.query(
      `ALTER TYPE "public"."log_entries_actiontype_enum" RENAME TO "log_entries_actiontype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_actiontype_enum" AS ENUM('user_registration', 'user_registration_failed', 'user_login', 'user_login_failed', 'user_logout', 'user_logout_failed', 'user_logout_all', 'user_logout_all_failed', 'user_created', 'user_updated', 'user_deleted', 'user_password_reset', 'user_email_verified', 'user_update', 'user_delete', 'token_refresh', 'token_refresh_failed', 'token_created', 'token_deleted', 'token_invalidated', 'api_request', 'api_response', 'api_error', 'api_rate_limit_exceeded', 'api_authentication_failed', 'api_authorization_failed', 'api_validation_failed', 'api_internal_server_error', 'file_create', 'file_edit', 'file_upload', 'file_download', 'file_delete', 'file_rename', 'file_move', 'code_execution', 'code_execution_error', 'code_compilation', 'code_compilation_error', 'chat_message_sent', 'chat_message_received', 'chat_session_started', 'chat_session_ended', 'chat_error', 'chat_rate_limited', 'ai_chat_message', 'ai_chat_response', 'system_error', 'system_warning', 'system_startup', 'system_shutdown', 'system_config_change', 'system_info', 'database_error', 'rate_limit_exceeded', 'security_violation')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ALTER COLUMN "actionType" TYPE "public"."log_entries_actiontype_enum" USING "actionType"::"text"::"public"."log_entries_actiontype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."log_entries_actiontype_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_actiontype_enum_old" AS ENUM('user_registration', 'user_registration_failed', 'user_login', 'user_login_failed', 'user_logout', 'user_logout_all', 'user_created', 'user_updated', 'user_deleted', 'user_password_reset', 'user_email_verified', 'user_update', 'user_delete', 'token_refresh', 'token_created', 'token_deleted', 'token_invalidated', 'api_request', 'api_response', 'api_error', 'api_rate_limit_exceeded', 'api_authentication_failed', 'api_authorization_failed', 'api_validation_failed', 'api_internal_server_error', 'file_create', 'file_edit', 'file_upload', 'file_download', 'file_delete', 'file_rename', 'file_move', 'code_execution', 'code_execution_error', 'code_compilation', 'code_compilation_error', 'chat_message_sent', 'chat_message_received', 'chat_session_started', 'chat_session_ended', 'chat_error', 'chat_rate_limited', 'ai_chat_message', 'ai_chat_response', 'system_error', 'system_warning', 'system_startup', 'system_shutdown', 'system_config_change', 'system_info', 'database_error', 'rate_limit_exceeded', 'security_violation')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ALTER COLUMN "actionType" TYPE "public"."log_entries_actiontype_enum_old" USING "actionType"::"text"::"public"."log_entries_actiontype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."log_entries_actiontype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."log_entries_actiontype_enum_old" RENAME TO "log_entries_actiontype_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "performanceMetrics" jsonb`);
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "userAgent" character varying`);
    await queryRunner.query(`ALTER TABLE "log_entries" ADD "sessionId" character varying`);
    await queryRunner.query(`CREATE INDEX "IDX_5486d7e7b0f610c7c500ab6d4e" ON "log_entries" ("sessionId") `);
  }
}
