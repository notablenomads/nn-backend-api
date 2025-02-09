import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import {
  ProjectType,
  ExistingProjectChallenge,
  TargetAudience,
  Industry,
  DesignStyle,
  Timeline,
  Budget,
  ContactMethod,
} from '../../lead/enums/lead.enum';

export class CreateLeadTable1710864200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'leads',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'services',
            type: 'text',
            isArray: true,
          },
          {
            name: 'projectType',
            type: 'enum',
            enum: Object.values(ProjectType),
          },
          {
            name: 'existingProjectChallenge',
            type: 'enum',
            enum: Object.values(ExistingProjectChallenge),
            isNullable: true,
          },
          {
            name: 'projectDescription',
            type: 'text',
          },
          {
            name: 'targetAudience',
            type: 'enum',
            enum: Object.values(TargetAudience),
          },
          {
            name: 'industry',
            type: 'enum',
            enum: Object.values(Industry),
          },
          {
            name: 'hasCompetitors',
            type: 'boolean',
          },
          {
            name: 'competitorUrls',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'hasExistingBrand',
            type: 'boolean',
          },
          {
            name: 'designStyle',
            type: 'enum',
            enum: Object.values(DesignStyle),
          },
          {
            name: 'timeline',
            type: 'enum',
            enum: Object.values(Timeline),
          },
          {
            name: 'budget',
            type: 'enum',
            enum: Object.values(Budget),
          },
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'email',
            type: 'text',
          },
          {
            name: 'company',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'preferredContactMethod',
            type: 'enum',
            enum: Object.values(ContactMethod),
          },
          {
            name: 'wantsConsultation',
            type: 'boolean',
          },
          {
            name: 'additionalNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: true,
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

    await queryRunner.createForeignKey(
      'leads',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('leads');
    if (table) {
      const foreignKey = table.foreignKeys.find((fk) => fk.columnNames.indexOf('userId') !== -1);
      if (foreignKey) {
        await queryRunner.dropForeignKey('leads', foreignKey);
      }
    }
    await queryRunner.dropTable('leads');
  }
}
