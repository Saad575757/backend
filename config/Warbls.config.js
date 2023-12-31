"use strict";
module.exports = {
  GLOBAL_TIME_ZONE: "+05:00",
  DB_PREFIX: "wb_",
  DB_DIALECT: "mysql",

  DB_POOL_MIN_CONNECTIONS: 0,
  DB_POOL_MAX_CONNECTIONS: 110,
  IDLE_TIMEOUT_MILLISECONDS: 2000,
  REAP_TIMEOUT_INTERVAL_MILLISECONDS: 1000,

  S3_AWS_FILE_ACL: "public-read",

  S3_BUCKET: "warbls",
  S3_ATTACHMENTS_FOLDER: "attachments",
  DEFAULT_FILE_UPLOAD_PLATFORM: "s3",

  O_AUTH: false,
  OAUTH_TOKEN_EXPIRY: 30,
  OAUTH_REFRESH_TOKEN_EXPIRY: 31,
  JWT_SECRET_KEY: "2b78e9e1049b02b4443b6eb6608e1355",

  WITHDRAW_AMOUNT_THRESHOLD: 1,

  PHRASE_AMOUNT: 19.90,
  ONESHOT_AMOUNT: 6.90,

  ARTIST_PHARASE_AMOUNT: 2.1,
  ARTIST_ONE_SHOT_AMOUNT: 0.7,

  UI_BASE_URL: "http://warbls.com",
};
