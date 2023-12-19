'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');
const TrackStatsLog = require('./TrackStatsLog');
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");

class TrackStats extends Model{
    static get jsonSchema() {
        return {
          default : ["ts_id","object_type","object_id","action","action_against_id","status","added_by","date_added"]
        }
    }

    static get tableName() {
        return dbconfig.dbTrackStats;
    }

    static get idColumn () {
        return 'ts_id';
    }

    $beforeDelete(opt, queryContext) {
        const log = JSON.parse(queryContext.reqObj.log);
    
        return TrackStats.bindKnex(knex)
            .query()
            .where("action_against_id", queryContext.action_against_id)
            .where("object_type", queryContext.reqObj.object_type)
            .where("object_id", queryContext.reqObj.object_id)
            .where("action", queryContext.reqObj.action)
            .then(data => {
                if (data.length > 0 && typeof data != undefined) {
                const TrackStatsLogData = helpers.buildModel(TrackStatsLog, data[0]);
                TrackStatsLogData.log_added_by = log.log_added_by;
                return TrackStatsLog.bindKnex(knex)
                    .query()
                    .insert(TrackStatsLogData)
                    .debug()
                    .then(logData => {
                        return logData;
                    });
                }
            });
    }
}

module.exports = TrackStats;