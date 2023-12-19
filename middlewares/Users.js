"use strict";
const Base = require("./Base");

class Users extends Base {
  constructor() {
    super();
  }

  static duplicateCheckParams(
    req,
    res,
    next,
    model,
    dupCheckParams = [],
    updateFlag
  ) {
    if (dupCheckParams.length === 0) {
      return next();
    } else {
      const data = req._request;
      let duplicateparamsflag = 0;
      for (let h = 0; h < dupCheckParams.length; h++) {
        if (dupCheckParams[h] in data && data[dupCheckParams[h]] != "") {
          duplicateparamsflag++;
        }
      }

      if (duplicateparamsflag > 0) {
        const knexObj = model.query();
        for (let i = 0; i < dupCheckParams.length; i++) {
          if (
            typeof data[dupCheckParams[i]] != "undefined" &&
            data[dupCheckParams[i]] != ""
          ) {
            knexObj.where(dupCheckParams[i], data[dupCheckParams[i]]);
          }
        }
        return knexObj.debug().then(function(data) {
          if (data.length > 0) {
            if (updateFlag == "T") {
              if (data.length > 1) {
                return res.status(409).json(dupCheckParams + " already exists");
              } else {
                const reqUserId = req.params.user_id;

                if (reqUserId == data[0].user_id) return next();
                else
                  return res
                    .status(409)
                    .json(dupCheckParams + " already exists");
              }
            } else
              return res.status(409).json(dupCheckParams + " already exists");
          } else {
            return next();
          }
        });
      } else return next();
    }
  }

  static validateAddRequest(req, res, next, params) {
    const requestMeta = req._request;
    const validatebleParams = params;

    if (Array.isArray(requestMeta)) {
      for (const i in requestMeta) {
        for (const j in validatebleParams) {
          if (!(validatebleParams[j] in requestMeta[i])) {
            // throw new Error('Bad Request Keys Missing');
            res.status(400).json("Bad Request Keys missing");
          }
        }
      }

      return next();
    } else {
      for (const j in validatebleParams) {
        if (!(validatebleParams[j] in requestMeta)) {
          // throw new Error('Bad Request Keys Missing');
          res.status(400).json("Bad Request Keys missing");
        } else {
          return next();
        }
      }
    }
  }
}

module.exports = Users;
