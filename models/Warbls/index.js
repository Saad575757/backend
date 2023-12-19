'use strict';
const config    = require('../../config/'+process.env.PROJECT+".config.js");
const objection = require('objection');
const Model     = objection.Model;
const Knex      = require('knex');

const knex = Knex({
  client     : config.DB_DIALECT || 'mysql',
  connection : {
      host      : process.env.DB_HOST,
      user      : process.env.DB_USERNAME,
      password  : process.env.DB_PASSWORD,
      database  : process.env.DB_NAME,
      timezone  : config.GLOBAL_TIME_ZONE||'+05:00',
      charset   : 'utf8mb4'
  },
  pool: { 
          min: parseInt(config.DB_POOL_MIN_CONNECTIONS), 
          max: parseInt(config.DB_POOL_MAX_CONNECTIONS),
          idleTimeoutMillis: parseInt(config.IDLE_TIMEOUT_MILLISECONDS),
          reapIntervalMillis: parseInt(config.REAP_TIMEOUT_INTERVAL_MILLISECONDS),
      }
});

Model.knex(knex);

module.exports = { Model: Model, knex: knex };
