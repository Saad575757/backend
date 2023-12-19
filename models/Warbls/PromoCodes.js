'use strict'
const Model = require('./index')['Model'];
const dbconfig = require('../../config/dbconfig');
const PromoCodesLog = require("./PromoCodesLog");
const knex = require("./index")["knex"];
const helpers = require("../../modules/helpers");

class PromoCodes extends Model{
    static get jsonSchema() {
        return {
          default : ["code_id","code","expire_at","added_by","date_added"]
        }
    }

    static get tableName() {

    return dbconfig.dbPromoCodes;
    }

    static get idColumn () {
        return 'code_id';
    }

    $beforeUpdate(opt, queryContext) {
        const log = JSON.parse(queryContext.reqobj.log);
    
        return PromoCodes.bindKnex(knex)
            .query()
            .where("code_id", queryContext.code_id)
            .then(data => {
                if (data.length > 0 && typeof data != undefined) {
                const PromoCodesLogData = helpers.buildModel(PromoCodesLog, data[0]);
                PromoCodesLogData.log_added_by = log.log_added_by;
                return PromoCodesLog.bindKnex(knex)
                    .query()
                    .insert(PromoCodesLogData)
                    .debug()
                    .then(logData => {
                        return logData;
                    });
                }
            });
    }
}

module.exports = PromoCodes;