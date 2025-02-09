import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateRefreshTokenTable1710864100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'varchar',
            length: '1000',
            isNullable: false,
          },
          {
            name: 'iv',
            type: 'varchar',
            length: '32',
            isNullable: false,
          },
          {
            name: 'authTag',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'isValid',
            type: 'boolean',
            default: true,
          },
          {
            name: 'wasUsed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for refresh_tokens -> users
    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_tokens');
    const foreignKey = table?.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('refresh_tokens', foreignKey);
    }
    await queryRunner.dropTable('refresh_tokens', true);
  }
}
