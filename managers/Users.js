"use strict";
const models = require("../models")["Warbls"];
const helpers = require("../modules/helpers");
const objection = require("objection");
const knex = require("../models/Warbls/index")["knex"];
const dbconfig = require("../config/dbconfig");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

class Users {
  static getUsersInfo(reqData) {
    let request = Object.assign({}, reqData);
    const knexObj = helpers.list(models.Users, request);

    if ("login" in reqData) {
      knexObj.where(dbconfig.dbUsers + ".username", reqData.login);
      knexObj.orWhere(dbconfig.dbUsers + ".email", reqData.login);
    }

    return knexObj
      .debug()
      .then(async (data) => {
        // check if user is artist and retrieve stripe connected account status
        if (data && data.total > 0 && data.results && data.results.length) {
          const user = data.results[0];
          if (user.st_ca_id) {
            return stripe.account
              .retrieve(user.st_ca_id)
              .then((account) => {
                data.results[0].isOnboardingComplete =
                  account.payouts_enabled && account.charges_enabled;
                return data;
              })
              .catch((err) => {
                data.results[0].isOnboardingComplete = null;
                return data;
              });
          }
        }
        return data;
      })
      .catch((err) => {
        return err;
      });
  }

  static addUser(data) {
    if ("password" in data)
      data["password"] = helpers.securePassword(data["password"]);

    const userData = helpers.buildModel(models.Users, data);

    return objection.transaction(knex, (trx) => {
      return models.Users.query(trx)
        .insertGraph(userData)
        .then((user) => {
          return user;
        });
    });
  }

  static updateUser(reqObj, userId) {
    console.log("in updateManager");
    const userUpdateData = helpers.buildModel(models.Users, reqObj);

    if ("password" in userUpdateData && userUpdateData.password != "") {
      const password = userUpdateData["password"];
      userUpdateData["password"] = helpers.securePassword(password);
    } else {
      delete userUpdateData.password;
    }

    return objection.transaction(knex, async function (trx) {
      return await models.Users.query()
        .updateAndFetchById(userId, userUpdateData)
        .context({ reqobj: reqObj, user_id: userId })
        .debug()
        .then((ok) => {
          return ok;
        });
    });
  }

  static update;

  static getUsersTypes(reqData) {
    let request = Object.assign({}, reqData);
    const knexObj = helpers.list(models.UserTypes, request);
    return knexObj
      .debug()
      .then((data) => {
        return data;
      })
      .catch((err) => {
        return err;
      });
  }

  static getUsersReports(reqData) {
    let request = Object.assign({}, reqData);
    const knexObj = helpers.list(models.UserReports, request);
    return knexObj
      .debug()
      .then((data) => {
        return data;
      })
      .catch((err) => {
        return err;
      });
  }

  static addUserReport(data) {
    const userReportData = helpers.buildModel(models.UserReports, data);

    return objection.transaction(knex, (trx) => {
      return models.UserReports.query(trx)
        .insertGraph(userReportData)
        .debug()
        .then((user) => {
          return user;
        });
    });
  }
}

module.exports = Users;
