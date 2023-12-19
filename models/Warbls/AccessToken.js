'use strict';
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class AccessToken extends Model {

  static get jsonSchema() {
    return {
      default : ["id", "access_token", "expires_at", "scope", "client_id"]
    }
  }

  static get tableName() {

    return dbconfig.dbAccessToken;
  }

  static get idColumn () {
      return 'id';
  }

}

module.exports = AccessToken;