'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');

class TrackStatsLog extends Model{
    static get jsonSchema() {
        return {
          default : ["tsl_id","ts_id","object_type","object_id","action","action_against_id","status","added_by","date_added",
          "log_added_by","log_date_added"]
        }
    }

    static get tableName() {
        return dbconfig.dbTrackStatsLog;
    }

    static get idColumn () {
        return 'tsl_id';
    }
}

module.exports = TrackStatsLog;