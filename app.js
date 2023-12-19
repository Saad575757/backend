"use strict";
require("dotenv").config();
const compression = require("compression");
const express = require("express");
const app = express();
const routes = require("./config/routes");
const helpers = require("./modules/helpers");
var fs = require("fs");

app.get("/", (req, res) => {
  res.send("Success");
});

app.use(compression());

require("./middlewares/Base").init(app);

routes(app);

// catch 404 and forward to error handler
// app.use(helpers.notFound);

// error handler
// app.use(helpers.errorHanlder);

module.exports = app;
