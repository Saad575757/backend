'use strict';
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class ArtistFormsLog extends Model {

  static get jsonSchema() {
    return {
      default : ["lf_id","form_id", "user_id", "previous_work", "sm_link", "genre" , "vocals" , "platform_link","status","added_by","date_added","log_added_by","log_date_added"]
    }
  }

  static get tableName() {

    return dbconfig.dbArtistFormLog;
  }

  static get idColumn () {
      return 'lf_id';
  }

}

module.exports = ArtistFormsLog;