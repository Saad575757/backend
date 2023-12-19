"use strict";
const { ApiRequestCache } = require("../models/")["Warbls"];

module.exports = (req, res, body) => {
  if ("job_id" in req.headers) {
    ApiRequestCache.query()
      .insert({
        request: JSON.stringify({
          headers: req.headers,
          params: req.params,
          query: req.query,
          body: req.body,
        }),
        response: JSON.stringify(body),
        status_code: res.statusCode,
        job_id: req.headers.job_id,
      })
      .then((cache) => {
        return cache;
      });
  }
};
