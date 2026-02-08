import { Tables } from '@libs/tables';
import { ReportModel, ReportOrmEntityProps } from './report.orm-entity';
import { Model, RelationMappings } from 'objection';
import { UserObjectionOrmEntity } from '@modules/users/database/entities';
import { CodeWordObjectionOrmEntity } from '@modules/reports/database/entities';

export class ReportObjectionOrmEntity extends ReportModel {
  static tableName = Tables.reports;

  static create(props: ReportOrmEntityProps) {
    return this.fromJson(props);
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: [
        'codeWordId',
        'userId',
        'status',
        'stitchesNormalized',
        'stitchesRaw',
      ],
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        codeWordId: { type: 'string' },
        userId: { type: 'string' },
        status: { type: 'string' },
        stitchesNormalized: { type: 'number' },
        stitchesRaw: { type: 'object' },
        startPhotoKey: { type: ['string', 'null'] },
        finishPhotoKey: { type: ['string', 'null'] },
        sagaScreenshotKey: { type: ['string', 'null'] },
        userComment: { type: ['string', 'null'] },
        reviewerComment: { type: ['string', 'null'] },
        reviewerId: { type: ['string', 'null'] },
        skipReviewerId: { type: ['string', 'null'] },
        reviewExpiresAt: { type: ['string', 'null'] },
        deleteAt: { type: ['string', 'null'] },
        approvedAt: { type: ['string', 'null'] },
      },
    };
  }

  static relationMappings: RelationMappings = {
    user: {
      relation: Model.HasOneRelation,
      modelClass: UserObjectionOrmEntity,
      join: {
        from: `${this.tableName}.userId`,
        to: `${UserObjectionOrmEntity.tableName}.id`,
      },
    },
    reviewer: {
      relation: Model.HasOneRelation,
      modelClass: UserObjectionOrmEntity,
      join: {
        from: `${this.tableName}.reviewerId`,
        to: `${UserObjectionOrmEntity.tableName}.id`,
      },
    },
    skipReviewer: {
      relation: Model.HasOneRelation,
      modelClass: UserObjectionOrmEntity,
      join: {
        from: `${this.tableName}.skipReviewerId`,
        to: `${UserObjectionOrmEntity.tableName}.id`,
      },
    },
    codeWord: {
      relation: Model.HasOneRelation,
      modelClass: CodeWordObjectionOrmEntity,
      join: {
        from: `${this.tableName}.codeWordId`,
        to: `${CodeWordObjectionOrmEntity.tableName}.id`,
      },
    },
  };
}
