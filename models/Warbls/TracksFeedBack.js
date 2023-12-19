'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');

class TracksFeedBack extends Model{
    static get jsonSchema() {
        return {
          default : ["tf_id","user_id","track_id","added_by","date_added"]
        }
    }

    static get tableName() {

    return dbconfig.dbTracksFeedBack;
    }

    static get idColumn () {
        return 'tf_id';
    }
}

module.exports = TracksFeedBack;