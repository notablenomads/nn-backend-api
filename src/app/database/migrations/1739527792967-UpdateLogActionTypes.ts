import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLogActionTypes1739527792967 implements MigrationInterface {
  name = 'UpdateLogActionTypes1739527792967';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."log_entries_actiontype_enum" RENAME TO "log_entries_actiontype_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_actiontype_enum" AS ENUM('user_registration', 'user_registration_failed', 'user_login', 'user_login_failed', 'user_logout', 'user_logout_all', 'user_created', 'user_updated', 'user_deleted', 'user_password_reset', 'user_email_verified', 'user_update', 'user_delete', 'token_refresh', 'token_created', 'token_deleted', 'token_invalidated', 'api_request', 'api_response', 'api_error', 'api_rate_limit_exceeded', 'api_authentication_failed', 'api_authorization_failed', 'api_validation_failed', 'api_internal_server_error', 'file_create', 'file_edit', 'file_upload', 'file_download', 'file_delete', 'file_rename', 'file_move', 'code_execution', 'code_execution_error', 'code_compilation', 'code_compilation_error', 'chat_message_sent', 'chat_message_received', 'chat_session_started', 'chat_session_ended', 'chat_error', 'chat_rate_limited', 'ai_chat_message', 'ai_chat_response', 'system_error', 'system_warning', 'system_startup', 'system_shutdown', 'system_config_change', 'system_info', 'database_error', 'rate_limit_exceeded', 'security_violation')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ALTER COLUMN "actionType" TYPE "public"."log_entries_actiontype_enum" USING "actionType"::"text"::"public"."log_entries_actiontype_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."log_entries_actiontype_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."log_entries_actiontype_enum_old" AS ENUM('user_registration', 'user_registration_failed', 'user_login', 'user_login_failed', 'user_logout', 'user_created', 'user_updated', 'user_deleted', 'user_password_reset', 'user_email_verified', 'file_create', 'file_edit', 'file_delete', 'file_rename', 'file_move', 'code_execution', 'code_execution_error', 'code_compilation', 'code_compilation_error', 'chat_message_sent', 'chat_message_received', 'chat_session_started', 'chat_session_ended', 'chat_error', 'chat_rate_limited', 'system_error', 'system_warning', 'system_startup', 'system_shutdown', 'system_config_change', 'database_error', 'api_error', 'rate_limit_exceeded', 'security_violation')`,
    );
    await queryRunner.query(
      `ALTER TABLE "log_entries" ALTER COLUMN "actionType" TYPE "public"."log_entries_actiontype_enum_old" USING "actionType"::"text"::"public"."log_entries_actiontype_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."log_entries_actiontype_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."log_entries_actiontype_enum_old" RENAME TO "log_entries_actiontype_enum"`,
    );
  }
}
