'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");

class TransactionsLog extends Model{
    static get jsonSchema() {
        return {
          default : ["trans_id","type","amount","currency","user_id","date_added"]
        }
    }

    static get tableName() {
        return dbconfig.dbTransactions;
    }

    static get idColumn () {
        return 'trans_id';
    }
}

module.exports = TransactionsLog;