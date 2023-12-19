'use strict';
require("dotenv").config({ path: require('app-root-path') + "/.env" });
const config    = require('./config/'+process.env.PROJECT+".config.js");
const migrationTable = 'knex_migrations';

module.exports = {
  Local: {
    client: config.DB_DIALECT,
    connection: {
      host      : process.env.DB_HOST,
      user      : process.env.DB_USERNAME,
      password  : process.env.DB_PASSWORD,
      database  : process.env.DB_NAME,
      timezone  : config.GLOBAL_TIME_ZONE||'+05:00'
    },
    migrations: {
      tableName: migrationTable
    }
  },
  development: {
    client: config.DB_DIALECT,
    connection: {
      host      : process.env.DB_HOST,
      user      : process.env.DB_USERNAME,
      password  : process.env.DB_PASSWORD,
      database  : process.env.DB_NAME,
      timezone  : config.GLOBAL_TIME_ZONE||'+05:00'
    },
    migrations: {
      tableName: migrationTable
    }
  },
  production: {
    client: config.DB_DIALECT,
    connection: {
      host      : process.env.DB_HOST,
      user      : process.env.DB_USERNAME,
      password  : process.env.DB_PASSWORD,
      database  : process.env.DB_NAME,
      timezone  : config.GLOBAL_TIME_ZONE||'+05:00'
    },
    migrations: {
      tableName: migrationTable
    }
  }

};
