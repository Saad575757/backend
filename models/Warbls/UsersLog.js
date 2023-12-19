"use strict";
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class UsersLog extends Model {
  static get jsonSchema() {
    return {
      default: [
        "luid",
        "user_id",
        "username",
        "full_name",
        "email",
        "password",
        "profile_image",
        "cover_image",
        "bio",
        "user_type",
        "is_suspended",
        "added_by",
        "date_added",
        "log_added_by",
        "log_date_added",
        "is_admin",
        "st_cust_id"
      ]
    };
  }

  static get tableName() {
    return dbconfig.dbUsersLog;
  }

  static get idColumn() {
    return "luid";
  }
}

module.exports = UsersLog;
