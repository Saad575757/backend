"use strict";
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class UserTypes extends Model {
  static get jsonSchema() {
    return {
      default: [
        "type_id",
        "type_title",
        "added_by",
        "date_added"
      ]
    };
  }

  static get tableName() {
    return dbconfig.dbUserTypes;
  }

  static get idColumn() {
    return "type_id";
  }
}

module.exports = UserTypes;
