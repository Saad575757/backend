'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');

class PromoCodesLog extends Model{
    static get jsonSchema() {
        return {
          default : ["lpc_id","code_id","code","expire_at","added_by","date_added","log_added_by","log_date_added"]
        }
    }

    static get tableName() {

    return dbconfig.dbPromoCodesLog;
    }

    static get idColumn () {
        return 'lpc_id';
    }
}

module.exports = PromoCodesLog;