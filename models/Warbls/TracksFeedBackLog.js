'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');

class TracksFeedBackLog extends Model{
    static get jsonSchema() {
        return {
          default : ["ltf_id","tf_id","user_id","track_id","added_by","date_added","log_added_by","log_date_added"]
        }
    }

    static get tableName() {

    return dbconfig.dbTracksFeedBackLog;
    }

    static get idColumn () {
        return 'ltf_id';
    }
}

module.exports = TracksFeedBackLog;