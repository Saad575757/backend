"use strict";
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");
const UsersLog = require("./UsersLog");
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");

class Users extends Model {
  static get jsonSchema() {
    return {
      default: [
        "user_id",
        "username",
        "full_name",
        "email",
        "password",
        "profile_image",
        "cover_image",
        "bio",
        "user_type",
        "is_admin",
        "is_suspended",
        "added_by",
        "date_added",
        "st_cust_id",
        "st_ca_id",
        "token_id",
        "reset_password_hash",
      ],
    };
  }

  static get tableName() {
    return dbconfig.dbUsers;
  }

  static get idColumn() {
    return "user_id";
  }

  static get relationMappings() {
    return {
      user_types: {
        relation: Model.BelongsToOneRelation,
        modelClass: __dirname + "/UserTypes",
        join: {
          from: dbconfig.dbUserTypes + ".type_id",
          to: dbconfig.dbUsers + ".user_type",
        },
      },
    };
  }

  $beforeUpdate(opt, queryContext) {
    const log = JSON.parse(queryContext.reqobj.log);

    return Users.bindKnex(knex)
      .query()
      .where("user_id", queryContext.user_id)
      .then((data) => {
        if (data.length > 0 && typeof data != undefined) {
          const UsersLogData = helpers.buildModel(UsersLog, data[0]);
          UsersLogData.log_added_by = log.log_added_by;
          return UsersLog.bindKnex(knex)
            .query()
            .insert(UsersLogData)
            .debug()
            .then((logData) => {
              return logData;
            });
        }
      });
  }
}

module.exports = Users;
