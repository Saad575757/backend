'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");

class Transactions extends Model{
    static get jsonSchema() {
        return {
          default : ["trans_id","order_details_id","type","amount","currency","user_id","date_added"]
        }
    }

    static get tableName() {
        return dbconfig.dbTransactions;
    }

    static get idColumn () {
        return 'trans_id';
    }

    static get relationMappings() {
        return {
            order_details: {
                relation: Model.HasOneRelation,
                modelClass: __dirname + "/OrderDetails",
                join: {
                    from: dbconfig.dbTransactions + ".order_details_id",
                    to: dbconfig.dbOrderDetails + ".order_details_id"
                }
            }
        };
    }
}

module.exports = Transactions;