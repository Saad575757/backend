'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");

class OrderDetails extends Model{
    static get jsonSchema() {
        return {
          default : ["order_details_id","order_id","track_id","amount","payment_method","source","date_added"]
        }
    }

    static get tableName() {
        return dbconfig.dbOrderDetails;
    }

    static get idColumn () {
        return 'order_details_id';
    }

    static get relationMappings() {
        return {
            track_details: {
                relation: Model.HasOneRelation,
                modelClass: __dirname + "/Tracks",
                join: {
                    from: dbconfig.dbOrderDetails + ".track_id",
                    to: dbconfig.dbTracks + ".track_id"
                }
            }
        };
    }
}

module.exports = OrderDetails;