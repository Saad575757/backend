'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");

class Invoice extends Model{
    static get jsonSchema() {
        return {
          default : ["invoice_id","order_id","invoice_url","invoice_meta","date_added"]
        }
    }

    static get tableName() {
        return dbconfig.dbInvoice;
    }

    static get idColumn () {
        return 'order_details_id';
    }
}

module.exports = Invoice;