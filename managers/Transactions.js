"use strict";
const models = require("../models")["Warbls"];
const helpers = require("../modules/helpers");
const objection = require("objection");
const knex = require("../models/Warbls/index")["knex"];

class Transactions {
    static getTransactionsInfo(reqData) {
      
      const knexObj = helpers.list(models.Transactions, reqData);
      
      return knexObj
            .debug()
            .then(data => {
              return data;
            });
    }

    static addTransactions(reqData){

        const transactionsData = reqData;

        return objection.transaction(knex, trx => {
          return models.Transactions.query(trx)
            .insertGraph(transactionsData)
            .debug()
            .then(record => {
              return record;
            });
        });
    }
}

module.exports = Transactions;