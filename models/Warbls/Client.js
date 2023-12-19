/* jshint indent: 2 */
'use strict';
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class Client extends Model {

  static get jsonSchema() {
    return {
     default  : ["id", "name", "client_id", "client_secret", "redirect_uri", "grant_types", "scope"]
    }
  }

  static get tableName() {

    return dbconfig.dbClient;
  }

  static get idColumn () {
      return 'id';
  }

}

module.exports = Client;