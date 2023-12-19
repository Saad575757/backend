"use strict";
const helpers = require("../modules/helpers");
const Base = require("./Base");
const models = require("../models")["Warbls"];

class Auth extends Base {
  constructor() {
    super();
  }

  static async validateAuthenticationRequest(req, res, next) {
    const reqHeaders = Object.assign({}, req.headers);
    const reqObj = Object.assign({}, req._request);
    let isUserAuthorized = 0;
    let user = 0;

    if ("username" in reqObj && "password" in reqObj) {
      await models.Users.query()
        .where((builder) => {
          if ('username' in reqObj)
          {
            builder.where('username', reqObj.username);
            builder.orWhere('email', reqObj.username);
          }
        })
        .where("password", reqObj.password)
        .where("is_suspended", 0)
        .first()
        .debug()
        .then(async userObj => {
          if (userObj && typeof userObj != undefined) {
            user = userObj;
            isUserAuthorized = 1;
          }
        })
        .catch(err => {
          console.log(err);
          isUserAuthorized = 0;
        });
    }

    if (isUserAuthorized == 1) {
      return next(user);
    } else return res.status(401).json(helpers.responseMessage(401));
  }
}

module.exports = Auth;
