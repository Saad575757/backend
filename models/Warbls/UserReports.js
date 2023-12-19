"use strict";
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class UsersReports extends Model {
  static get jsonSchema() {
    return {
      default: [
        "report_id",
        "user_id",
        "reported_by",
        "type",
        "added_by",
        "date_added"
      ]
    };
  }

  static get tableName() {
    return dbconfig.dbUserReports;
  }

  static get idColumn() {
    return "report_id";
  }
}

module.exports = UsersReports;
