"use strict";
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helpers = require("../modules/helpers");
const oauth = require("../modules/OAuth");
const requestCache = require("../modules/mysql_cache");
const { ApiRequestCache } = require("../models/")["Warbls"];
const knex = require("../models/Warbls/index")["knex"];
const config = require("../config/" + process.env.PROJECT + ".config.js");
const moment = require("moment");
const cors = require("cors");
const dbConfig = require("../config/dbconfig");

const path = require("path");

class Base {
  constructor() {}

  static init(app) {
    app.use(logger("dev"));
    app.use(bodyParser.json({ limit: "50mb" }));
    app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
    app.use(cookieParser());
    app.use(express.static("public"));
    // app.use(express.json());

    const cors = require("cors");
    // app.use(cors());
    // app.use((req, res, next) => {
    //   res.header("Access-Control-Allow-Origin", "*");
    //   res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST');
    //   res.header(
    //     "Access-Control-Allow-Headers",
    //     "Origin, X-Requested-With, Content-Type, Accept"
    //   );
    //   next();
    // });

    app.use(
      cors({
        origin: ["http://localhost:5000", "https://www.warbls.com"],
      })
    );

    // OAuth2 routes
    app.all("/oauth/token", Base.token);

    // middleware to verify token

    if (config.O_AUTH == true) {
      Base.authenticate.unless = require("express-unless");
      app.use(
        Base.authenticate.unless({
          path: [
            { url: "/auth/login", methods: ["GET", "PUT", "POST"] },
            { url: "/tracks", methods: ["GET"] },
            { url: "/users", methods: ["POST"] },
          ],
        })
      );
    }

    app.use(Base.cacheRequest);
    app.use(helpers.setParams);
  }

  static authenticate(req, res, next) {
    return (
      oauth
        .authenticateHandler()(req, res, next)
        // eslint-disable-next-line no-unused-vars
        .then((token) => {
          next();
        })
        .catch(async (err) => {
          const token = req.headers["token"];
          if (token) {
            // verifies secret and checks exp
            const verificationResponse = await helpers.verifyJWT(token);

            if (verificationResponse.err != null) {
              return res
                .status(401)
                .json({ message: "Invalid authentication token." });
            } else {
              req.decoded = verificationResponse.decoded;
              next();
            }
          } else if ("code" in err) {
            return res.status(401).json(err);
            // res.json(err);
          } else {
            // if there is no token return an error
            return res.status(400).send({
              message: "No token provided.",
            });
          }
        })
    );
  }

  static token(req, res, next) {
    oauth.tokenHandler()(req, res, next);
  }

  static authorize(req, res, next) {
    oauth.authorizeHandler()(req, res, next);
  }

  static cacheRequest(req, res, next) {
    let jobId = moment().unix();
    if (req.headers.job_id != undefined) {
      jobId = req.headers.job_id;
    } else if (req.method != "GET") {
      const selfDefinedJobId = req.originalUrl
        .replace(/[\-_()+ ]/g, "")
        .split("/");
      req.headers.job_id = (
        req.method +
        "_" +
        selfDefinedJobId.slice(1).join("_") +
        "_" +
        jobId
      ).toString();
    }

    if (jobId) {
      try {
        return ApiRequestCache.query()
          .where("job_id", knex.raw("'" + jobId + "'"))
          .first()
          .debug()
          .then((data) => {
            if (data) {
              if ("response" in data && "status_code" in data) {
                const resBody =
                  data.response != null && data.response != ""
                    ? JSON.parse(data.response)
                    : "";
                res.status(data.status_code).json(resBody);
              } else res.status(400).send();
            } else {
              const old = res.json.bind(res);
              res.json = (body) => {
                requestCache(req, res, body);
                old(body);
              };

              return next();
            }
          });
      } catch (exception) {
        return next();
      }
    } else {
      return next();
    }
  }

  static validateRequest(req, res, next, requireParams = []) {
    if (requireParams.length === 0) return next();
    else {
      const result = [];
      const data = Object.assign({}, req._request);
      requireParams.forEach((param) => {
        if (typeof data[param] == "undefined" && param.length > 0)
          result.push(param + " is missing in request");
      });
      if (result.length === 0) return next();
      else res.status(400).json(result);
    }
  }

  static validateListRequest(req, res, next, requireParams = []) {
    if (requireParams.length === 0) return next();
    else {
      const reqData = req._request;
      const result = [];
      if (reqData instanceof Array) {
        for (let i = 0; i < reqData.length; i++) {
          requireParams.forEach((param) => {
            if (typeof reqData[i][param] == "undefined" && param.length > 0)
              result.push(param + " is missing in request");
          });
        }

        if (result.length === 0) return next();
        else res.status(400).json(result);
      } else res.status(400).json("Invalid Array of Objects in request.");
    }
  }

  static availableBalanceInWalletToWithdraw(req, res, next, userId) {
    const sqlQuery = `SELECT
                        ROUND(SUM(IF(wt.type= 'deposit',wt.amount,0)),2) AS total_deposited,
                        ROUND(SUM(IF(wt.type= 'withdraw',wt.amount,0)),2) AS total_withdrawed,
                        ROUND(SUM(IF(wt.type= 'deposit',wt.amount,0)),2) - ROUND(SUM(if(wt.type= 'withdraw',wt.amount,0)),2) AS available
                      FROM
                      ${dbConfig.dbTransactions} AS wt
                      WHERE 
                        wt.user_id =${userId}`;

    return knex
      .raw(sqlQuery)
      .debug()
      .then(async (data) => {
        if (data.length > 0 && data[0].length > 0) {
          next(data[0][0].available, req, res, next);
        } else {
          res.status(400).json("No data found again give user_id");
        }
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
}

module.exports = Base;
