"use strict";
const jwtHandler = require("../modules/jwt");
const models = require("../models")["Warbls"];
const objection = require("objection");
const knex = require("../models/Warbls/index")["knex"];
const dbConfig = require("../config/dbconfig");
const moment = require("moment");
const helpers = require("../modules/helpers");
class Auth {
  static async getToken(reqHeaders, reqObj, user) {
    const tokenData = jwtHandler.createToken(user);
    const logData = {};
    logData.activity_type = "login";
    logData.user_id = user.user_id;
    logData.browser_agent = reqHeaders["user-agent"];
    logData.session = tokenData;
    if ("date_added" in reqObj) logData.date_added = reqObj.date_added;
    if ("source" in reqObj) logData.source = reqObj.source;
    return objection.transaction(knex, (trx) => {
      return models.UserActivities.query(trx)
        .insert(logData)
        .debug()
        .then(() => {
          return tokenData;
        })
        .catch((err) => {
          return err;
        });
    });
  }
}
module.exports = Auth;
