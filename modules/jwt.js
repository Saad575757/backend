"use strict";
const jwt = require("jsonwebtoken"); // for handling jsonwebtokens
const config = require("../config/" + process.env.PROJECT + ".config.js");

module.exports.createToken = user => {
  const payload = {
    admin: user.username,
    adminId: user.user_id,
    email: user.email
  };

  return jwt.sign(payload, config.JWT_SECRET_KEY, { expiresIn: "10h" });
};
