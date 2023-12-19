'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");

class Orders extends Model{
    static get jsonSchema() {
        return {
          default : ["order_id","user_id","order_status","date_added"]
        }
    }

    static get tableName() {
        return dbconfig.dbOrders;
    }

    static get idColumn () {
        return 'order_id';
    }

    static get relationMappings() {
        return {
            user_details: {
                relation: Model.HasOneRelation,
                modelClass: __dirname + "/Users",
                join: {
                    from: dbconfig.dbOrders + ".user_id",
                    to: dbconfig.dbUsers + ".user_id"
                }
            },
            order_details: {
                relation: Model.HasManyRelation,
                modelClass: __dirname + "/OrderDetails",
                join: {
                    from: dbconfig.dbOrders + ".order_id",
                    to: dbconfig.dbOrderDetails + ".order_id"
                }
            },
            invoice: {
                relation: Model.HasOneRelation,
                modelClass: __dirname + "/Invoice",
                join: {
                    from: dbconfig.dbOrders + ".order_id",
                    to: dbconfig.dbInvoice + ".order_id"
                }
            },
        };
    }
}

module.exports = Orders;