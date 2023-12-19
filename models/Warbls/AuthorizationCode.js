/* jshint indent: 2 */
'use strict';
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class AuthorizationCode extends Model {

  static get jsonSchema() {
    return {
      default : ["id", "authorization_code", "client_id", "expires_at", "redirect_uri", "scope"]
    }
  }

  static get tableName() {

    return dbconfig.dbAuthorizationCode;
  }

  static get idColumn () {
      return 'id';
  }

  static get relationMappings() {

    return {
      
      admin_team_member: {
        relation: Model.HasManyRelation,

        modelClass: __dirname + '/Client',
        join: {
          from: dbconfig.dbAuthorizationCode + ".client_id",
          to: dbconfig.dbClient + ".client_id"
        }
      }

    }
   }

}

module.exports = AuthorizationCode;