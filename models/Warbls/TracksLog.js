'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');

class TracksLog extends Model{
    static get jsonSchema() {
        return {
          default : ["lt_id","track_id","track_name","image_url","track_desc","track_url","track_time","status","language","bpm","key","genre","is_phrases","is_oneshot","price","added_by","date_added","log_added_by","log_date_added","is_dry","is_wet"]
        }
    }

    static get tableName() {

    return dbconfig.dbTracksLog;
    }

    static get idColumn () {
        return 'lt_id';
    }
}

module.exports = TracksLog;