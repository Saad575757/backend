"use strict";
const router = require("express")();
const authManager = require("../managers/Auth");
const authMw = require("../middlewares/Auth");

router.post(
  "/login",
  (req, res, next) => {
    authMw.validateAuthenticationRequest(req, res, next);
  },
  (user, req, res, next) => {
    const reqObj = Object.assign({}, req._request);
    const reqHeaders = Object.assign({}, req.headers);

    authManager
      .getToken(reqHeaders, reqObj, user)
      .then(token => {
        res.status(200).json(token);
      })
      .catch(err => {
        return next(err);
      });
  }
);

module.exports = router;
