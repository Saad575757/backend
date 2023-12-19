/* jshint indent: 2 */
'use strict';
const Model = require("./index")["Model"];
const dbconfig = require("../../config/dbconfig");

class ApiRequestCache extends Model {

  static get tableName() {

    return dbconfig.dbApiRequestCache;
  }

}

module.exports = ApiRequestCache;
