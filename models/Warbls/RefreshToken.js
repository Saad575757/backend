/* jshint indent: 2 */
'use strict';
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class RefreshToken extends Model {

  static get jsonSchema() {
    return {
     default  : ["id", "refresh_token", "expires_at", "scope", "client_id"]
    }
  }

  static get tableName() {

    return dbconfig.dbRefreshToken;
  }

  static get idColumn () {
      return 'id';
  }

}

module.exports = RefreshToken;
