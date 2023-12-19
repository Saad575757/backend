"use strict";
const models = require("../models")["Warbls"];
const helpers = require("../modules/helpers");
const objection = require("objection");
const knex = require("../models/Warbls/index")["knex"];


class PromoCodes {
    static getPromoCodes(reqData) {
      let request = Object.assign({}, reqData);
      const knexObj = helpers.list(models.PromoCodes, request);
      return knexObj
        .debug()
        .then(data => {
          return data;
        })
        .catch(err => {
          return err;
        });
    }

    static updatePromoCode(reqObj, code_id) {
        const updatedData = helpers.buildModel(models.PromoCodes, reqObj);

        return objection.transaction(knex, async function (trx) {
            return await models.PromoCodes.query()
            .updateAndFetchById(code_id,updatedData)
            .context({reqobj : reqObj , code_id:code_id})
            .debug()
            .then((ok)=>{
              return ok;
            });
        });
    }

    static addPromoCode(data) {
      const promoCodesData = helpers.buildModel(models.PromoCodes, data);
  
      return objection.transaction(knex, trx => {
        return models.PromoCodes.query(trx)
          .insertGraph(promoCodesData)
          .debug()
          .then(user => {
            return user;
          });
      });
    }
}

module.exports = PromoCodes;