"use strict";
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class UsersReportsLog extends Model {
  static get jsonSchema() {
    return {
      default: [
        "lrid",
        "report_id",
        "user_id",
        "reported_by",
        "type",
        "added_by",
        "date_added",
        "log_added_by",
        "log_date_added"
      ]
    };
  }

  static get tableName() {
    return dbconfig.dbUserReportsLog;
  }

  static get idColumn() {
    return "lrid";
  }
}

module.exports = UsersReportsLog;
