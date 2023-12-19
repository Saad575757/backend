'use strict';
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");
const ArtistFormsLog = require("./ArtistFormsLog");
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");


class ArtistForms extends Model {

  static get jsonSchema() {
    return {
      default : ["form_id", "user_id", "previous_work", "sm_link", "genre" , "vocals" , "platform_link","status","added_by","date_added"]
    }
  }

  static get tableName() {
    return dbconfig.dbArtistForm;
  }

  static get idColumn () {
    return 'form_id';
  }
  
  $beforeUpdate(opt, queryContext) {
    const log = JSON.parse(queryContext.reqobj.log);

    return ArtistForms.bindKnex(knex)
        .query()
        .where("form_id", queryContext.form_id)
        .then(data => {
            if (data.length > 0 && typeof data != undefined) {
            const ArtisrFormLogData = helpers.buildModel(ArtistFormsLog, data[0]);
            ArtisrFormLogData.log_added_by = log.log_added_by;
            return ArtistFormsLog.bindKnex(knex)
                .query()
                .insert(ArtisrFormLogData)
                .debug()
                .then(logData => {
                    return logData;
                });
            }
        });
}

}

module.exports = ArtistForms;