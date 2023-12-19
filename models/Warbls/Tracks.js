'use strict';
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');
const TracksLog = require('./TracksLog');
const knex = require('./index')['knex'];
const helpers = require('../../modules/helpers');

class Tracks extends Model {
  static get jsonSchema() {
    return {
      default: [
        'track_id',
        'track_name',
        'image_url',
        'track_desc',
        'track_url',
        'track_time',
        'status',
        'language',
        'bpm',
        'key',
        'genre',
        'is_phrases',
        'is_oneshot',
        'added_by',
        'date_added',
        'price',
        'is_dry',
        'is_wet',
      ],
    };
  }

  static get tableName() {
    return dbconfig.dbTracks;
  }

  static get idColumn() {
    return 'track_id';
  }

  $beforeUpdate(opt, queryContext) {
    const log = JSON.parse(queryContext.reqobj.log);

    return Tracks.bindKnex(knex)
      .query()
      .where('track_id', queryContext.track_id)
      .then((data) => {
        if (data.length > 0 && typeof data != undefined) {
          const TracksLogData = helpers.buildModel(TracksLog, data[0]);
          TracksLogData.log_added_by = log.log_added_by;
          return TracksLog.bindKnex(knex)
            .query()
            .insert(TracksLogData)
            .debug()
            .then((logData) => {
              return logData;
            });
        }
      });
  }

  static get relationMappings() {
    return {
      user_details: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + '/Users',
        join: {
          from: dbconfig.dbTracks + '.added_by',
          to: dbconfig.dbUsers + '.user_id',
        },
      },
      track_stats: {
        relation: Model.HasManyRelation,
        modelClass: __dirname + '/TrackStats',
        join: {
          from: dbconfig.dbTracks + '.track_id',
          to: dbconfig.dbTrackStats + '.action_against_id',
        },
      },
    };
  }
}

module.exports = Tracks;
