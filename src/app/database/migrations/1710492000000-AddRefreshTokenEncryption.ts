import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRefreshTokenEncryption1710492000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('refresh_tokens', [
      new TableColumn({
        name: 'encrypted_token',
        type: 'varchar',
        length: '1000',
        isNullable: true,
      }),
      new TableColumn({
        name: 'token_iv',
        type: 'varchar',
        length: '24',
        isNullable: true,
      }),
      new TableColumn({
        name: 'token_auth_tag',
        type: 'varchar',
        length: '32',
        isNullable: true,
      }),
    ]);

    // Copy existing tokens to encrypted_token (optional)
    await queryRunner.query(`
      UPDATE refresh_tokens 
      SET encrypted_token = token 
      WHERE encrypted_token IS NULL AND token IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('refresh_tokens', ['encrypted_token', 'token_iv', 'token_auth_tag']);
  }
}
